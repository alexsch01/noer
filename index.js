const https = require('https')
const http = require('http')
const fs = require('fs/promises')
const qs = require('querystring')
const path = process.cwd() + require('path').sep

let originalHTML

async function _serveHTML(res, file, dict={}) {
    if (originalHTML == undefined) {
        originalHTML = (await fs.readFile(file)).toString()
    }
    let html = originalHTML
    for(let key in dict) {
        html = originalHTML.replaceAll(`#{${key}}`, dict[key])
    }
    res.end(html.replace(/\#{.*}/g, ''))
}

module.exports = function (file, [port, hostname], func = (serveHTML, data) => serveHTML(), firstLoad = (serveHTML) => serveHTML(), httpsOptions={key: null, cert: null}) {
    file = path + file
    func ||= (serveHTML, data) => serveHTML()
    firstLoad ||= (serveHTML) => serveHTML()

    let protocol
    if(httpsOptions.key && httpsOptions.cert) {
        httpsOptions.key = fs.readFileSync(path + httpsOptions.key)
        httpsOptions.cert = fs.readFileSync(path + httpsOptions.cert)
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
