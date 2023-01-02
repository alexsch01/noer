const http = require('http')
const fsPromises = require('fs/promises')
const qs = require('querystring')
const path = require('path')

function _serveHTML(res, file, dict={}) {
    fsPromises.readFile(file).then(contents => {
        let html = contents.toString()
        for(let key in dict)
            html = html.replaceAll(`\${${key}}`, dict[key])
        res.end(html.replace(/\${.*}/g, ''))
    })
}

module.exports = function (file, port, func = (serveHTML, data) => { serveHTML() }, firstLoad = (serveHTML) => { serveHTML() }) {
    file = path.join(__dirname, '../../') + file
    func ||= (serveHTML, data) => { serveHTML() }
    
    const server = http.createServer((req, res) => {
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
    server.listen(port)
}