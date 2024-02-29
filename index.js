const https = require('https')
const http = require('http')
const fs = require('fs')
const qs = require('querystring')
const path = require('path')

const fsPromises = fs.promises

let myPath
if(fs.lstatSync(process.argv[1]).isDirectory()) {
    myPath = process.argv[1]
} else {
    myPath = path.dirname(process.argv[1])
}
myPath += path.sep

let originalHTML
let serveNeeded

async function _serveHTML(res, file, dict={}) {
    serveNeeded = false
    originalHTML ??= (await fsPromises.readFile(file)).toString()
    let html = originalHTML
    for(const key in dict) {
        html = html.replaceAll(`@{${key}}`, dict[key])
    }
    res.end(html.replace(/@{.*?}/g, ''))
}

function makeSafe(func) {
    if(typeof func == 'function') {
        return async (serveHTML, data) => {
            await func.apply(null, [serveHTML, data])
            if(serveNeeded) {
                serveHTML()
            }
        }
    }
    return (serveHTML) => serveHTML()
}

module.exports = function (file, [port, hostname],
    /** @type {(serveHTML: Function, data) => {}} */ postLoad,
    /** @type {(serveHTML: Function) => {}} */ firstLoad,
    httpsOptions={key: null, cert: null}
) {
    file = myPath + file
    hostname ??= 'localhost'
    postLoad = makeSafe(postLoad)
    firstLoad = makeSafe(firstLoad)

    let /** @type {http} */ protocol
    if(httpsOptions.key && httpsOptions.cert) {
        httpsOptions.key = fs.readFileSync(myPath + httpsOptions.key)
        httpsOptions.cert = fs.readFileSync(myPath + httpsOptions.cert)
        protocol = https
    } else {
        protocol = http
    }

    const otherThanHTML = {}

    const server = protocol.createServer(httpsOptions, (req, res) => {
        serveNeeded = true
        if(req.url != '/') {
            if(req.url.endsWith('.js')) {
                res.setHeader('content-type', 'text/javascript')
            }

            if(otherThanHTML[req.url]) {
                res.end(otherThanHTML[req.url])
            } else {
                fsPromises.readFile(path.resolve(file, '..', req.url.substring(1))).then((buffer) => {
                    res.end(buffer)
                    otherThanHTML[req.url] = buffer
                }).catch((_) => {
                    fsPromises.readFile(path.resolve(file, '..', req.url.substring(1), 'index.html')).then((buffer) => {
                        res.end(buffer)
                        otherThanHTML[req.url] = buffer
                    }).catch((_) => {
                        res.writeHead(404)
                        res.end()
                    })
                })
            }
        } else {
            if(req.method == 'POST') {
                let body = ''
                req.on('data', chunk => {
                    body += chunk.toString()
                })
                req.on('end', () => {
                    postLoad(dict => {
                        _serveHTML(res, file, dict)
                    }, qs.parse(body))
                })
            } else {
                firstLoad(dict => {
                    _serveHTML(res, file, dict)
                })
            }
        }
    })

    server.listen(port, hostname, () => {
        console.log(`Listening on ${hostname}:${server.address().port}`)
    })
}
