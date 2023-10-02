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

        let scriptFile
        for(let x of originalHTML.matchAll(/\<script src=(.*?)\>\<\/script\>/g)) {
            try {
                scriptFile = x[1]
                if(
                    (scriptFile.startsWith('\'') && scriptFile.endsWith('\'')) || 
                    (scriptFile.startsWith('"') && scriptFile.endsWith('"'))
                ) {
                    scriptFile = scriptFile.slice(1, -1)
                    originalHTML = originalHTML.replace(x[0], `<script>${(await fs.readFile(path.resolve(file, '..', scriptFile))).toString()}</script>`)
                }
            } catch(e) {}
        }

        let cssFile
        for(let x of 
            Array.from(originalHTML.matchAll(/\<link rel="stylesheet" href=(.*?)\>/g)).concat(
            Array.from(originalHTML.matchAll(/\<link rel='stylesheet' href=(.*?)\>/g))
        )) {
            try {
                cssFile = x[1]
                if(
                    (cssFile.startsWith('\'') && cssFile.endsWith('\'')) || 
                    (cssFile.startsWith('"') && cssFile.endsWith('"'))
                ) {
                    cssFile = cssFile.slice(1, -1)
                    originalHTML = originalHTML.replace(x[0], `<style>${(await fs.readFile(path.resolve(file, '..', cssFile))).toString()}</style>`)
                }
            } catch(e) {}
        }
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
    
    const server = protocol.createServer(httpsOptions, (req, res) => {
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
    })

    if(!hostname) {
        hostname = 'localhost'
    }

    server.listen(port, hostname, () => {
        console.log(`Listening on ${server.address().address}:${server.address().port} - ${server.address().family}`)
    })
}
