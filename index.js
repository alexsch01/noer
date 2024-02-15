const https = require('https')
const http = require('http')
const fs = require('fs')
const qs = require('querystring')
const path = require('path')

const fsPromises = fs.promises
const myPath = process.cwd() + path.sep
let originalHTML

async function _serveHTML(res, file, dict={}) {
    originalHTML ??= (await fsPromises.readFile(file)).toString()
    let html = originalHTML
    for(const key in dict) {
        html = html.replaceAll(`@{${key}}`, dict[key])
    }
    res.end(html.replace(/@{.*?}/g, ''))
}

module.exports = function (file, [port, hostname], func, firstLoad, httpsOptions={key: null, cert: null}) {
    file = myPath + file
    hostname ??= 'localhost'
    func ??= (serveHTML, data) => serveHTML()
    firstLoad ??= (serveHTML) => serveHTML()

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
                }).catch((e) => {
                    res.writeHead(404)
                    res.end()
                })
            }
        } else {
            if(req.method == 'POST') {
                let body = ''
                req.on('data', chunk => {
                    body += chunk.toString()
                })
                req.on('end', () => {
                    func(dict => {
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
