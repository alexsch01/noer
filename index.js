const https = require('https')
const http = require('http')
const fs = require('fs/promises')
const qs = require('querystring')
const path = require('path')

const myPath = process.cwd() + path.sep
let originalHTML

async function _serveHTML(res, file, dict={}) {
    if(originalHTML == undefined) {
        originalHTML = (await fs.readFile(file)).toString()
    }
    let html = originalHTML
    for(let key in dict) {
        html = html.replaceAll(`#{${key}}`, dict[key])
    }
    res.end(html.replace(/\#{.*?}/g, ''))
}

module.exports = function (file, [port, hostname], func = (serveHTML, data) => serveHTML(), firstLoad = (serveHTML) => serveHTML(), httpsOptions={key: null, cert: null}) {
    file = myPath + file
    func ||= (serveHTML, data) => serveHTML()
    firstLoad ||= (serveHTML) => serveHTML()

    let protocol
    if(httpsOptions.key && httpsOptions.cert) {
        httpsOptions.key = fs.readFileSync(myPath + httpsOptions.key)
        httpsOptions.cert = fs.readFileSync(myPath + httpsOptions.cert)
        protocol = https
    } else {
        protocol = http
    }

    let otherThanHTML = {}
    
    const server = protocol.createServer(httpsOptions, (req, res) => {
        if(req.url != '/') {
            if(otherThanHTML[req.url]) {
                res.end(otherThanHTML[req.url])
            } else {
                fs.readFile(path.resolve(file, '..', req.url.substring(1))).then((buffer) => {
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

    if(!hostname) {
        hostname = 'localhost'
    }

    server.listen(port, hostname, () => {
        console.log(`Listening on ${server.address().address}:${server.address().port} - ${server.address().family}`)
    })
}
