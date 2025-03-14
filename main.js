//@ts-check
const https = require('https')
const http = require('http')
const fs = require('fs')
const qs = require('querystring')
const path = require('path')

const fsPromises = fs.promises
const location = process.argv[1]
const isDev = (process.argv[2] == '--dev')

if(process.argv[2] != undefined && !isDev) {
    /*      process.argv[2] is defined and it is not "--dev"      */ throw {}
}

let myPath
if(fs.lstatSync(location).isDirectory()) {
    myPath = location
} else {
    myPath = path.dirname(location)
}
myPath += path.sep

let originalHTML

async function _serveHTML(res, file, dict={}) {
    if(originalHTML == undefined || isDev) {
        originalHTML = (await fsPromises.readFile(file)).toString()
    }
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
        }
    }
    return async (serveHTML) => serveHTML()
}

module.exports = function (
    /** @type {string} */ file, 
    /** @type {readonly [number, string?]} */ [port, hostname],
    /** @type {((serveHTML: Function, data: Record<string, string>) => any)?} */ postLoad,
    /** @type {((serveHTML: Function) => any)?} */ firstLoad,
    /** @type {{key: any, cert: any}?} */ httpsOptions,
    /** @type {Record<string, string>?} */ redirects,
) {
    file = myPath + file
    hostname ??= 'localhost'
    postLoad = makeSafe(postLoad)
    firstLoad = makeSafe(firstLoad)
    httpsOptions ??= {key: null, cert: null}
    redirects ??= {}

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
        let serveNeeded = true
        req.url = req.url.split('?')[0]

        for(const [origin, destination] of Object.entries(redirects)) {
            if (req.url === origin) {
                res.writeHead(302, {
                    location: destination
                })
                res.end()
                return
            }
        }

        if(req.url != '/') {
            if(req.url.endsWith('.js') || req.url.endsWith('.mjs')) {
                res.setHeader('content-type', 'text/javascript')
            }
            
            if(req.url.endsWith('.wasm')) {
                res.setHeader('content-type', 'application/wasm')
            }

            if(otherThanHTML[req.url] && !isDev) {
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
                        res.end("404 Not Found")
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
                        serveNeeded = false
                        _serveHTML(res, file, dict)
                    }, qs.parse(body))
                    .then(() => {
                        if(serveNeeded) {
                            _serveHTML(res, file)
                        }
                    })
                })
            } else if(req.method == 'GET') {
                firstLoad(dict => {
                    serveNeeded = false
                    _serveHTML(res, file, dict)
                })
                .then(() => {
                    if(serveNeeded) {
                        _serveHTML(res, file)
                    }
                })
            }
        }
    })

    server.listen(port, hostname, () => {
        console.log(`Listening on ${hostname}:${server.address().port}`)
    })
}
