//@ts-check
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const fsPromises = fs.promises
const location = process.argv[1]
const isDev = (process.argv[2] === '--dev')

if(process.argv[2] !== undefined && !isDev) {
    /*      process.argv[2] is defined and it is not "--dev"      */ throw {}
}

let myPath
if(fs.lstatSync(location).isDirectory()) {
    myPath = location
} else {
    myPath = path.dirname(location)
}
myPath += path.sep

/**
 * @param {object} param
 * 
 * 
 * @param {string} param.publicDir
 * @param {number} param.port
 * 
 * @param {string} [param.hostname]
 * @param {Record<string, ((data: any) => Promise<{
 *  statusCode?: number,
 *  headers?: http.OutgoingHttpHeaders | http.OutgoingHttpHeader[],
 *  chunk?: any,
 * }> | Promise<string>) | string>} [param.routes]
 * @param {{ key: string, cert: string }} [param.httpsOptions]
 */
module.exports = function ({
    publicDir,
    port,

    hostname,
    routes,
    httpsOptions,
}) {
    publicDir = path.resolve(myPath, publicDir)

    hostname ??= 'localhost'
    routes ??= {}
    httpsOptions ??= {key: '', cert: ''}

    let /** @type {https} */ protocol
    const options = {}
    if(httpsOptions.key && httpsOptions.cert) {
        options.key = fs.readFileSync(path.resolve(myPath, httpsOptions.key))
        options.cert = fs.readFileSync(path.resolve(myPath, httpsOptions.cert))
        protocol = https
    } else {
        // @ts-expect-error
        protocol = http
    }

    const cache = {}

    /**
     * @param {http.IncomingMessage} request 
     * @returns {Promise<string>}
     */
    const getPayloadString = function(request) {
        return new Promise((resolve) => {
            let body = ''
            request.on('data', (chunk) => {
                body += chunk
            }).on('end', () => {
                resolve(body)
            })
        })
    }

    const server = protocol.createServer(options, async (req, res) => {
        if (req.url === undefined) throw new Error("req.url is undefined")
        req.url = req.url.split('?')[0]

        if(req.url in routes) {
            const route = routes[req.url]
            if (typeof route === 'string') {
                res.writeHead(302, {
                    location: route
                })
                res.end()
                return
            }

            let result
            try {
                const payloadString = await getPayloadString(req)

                let requestPayload
                if (payloadString !== "") {
                    requestPayload = JSON.parse(payloadString)
                }

                result = await route(requestPayload)
            } catch(_) {
                res.writeHead(500)
                res.end("Internal server error")
                return
            }

            if (typeof result === 'string') {
                res.end(result)
                return
            }

            try {
                const { statusCode, headers, chunk } = result
                res.writeHead(statusCode ?? 200, headers)
                res.end(chunk, undefined)
            } catch(_) {
                res.writeHead(500)
                res.end("Internal server error")
            } finally {
                return
            }
        }

        if(req.url.endsWith('.js') || req.url.endsWith('.mjs')) {
            res.setHeader('content-type', 'text/javascript')
        }
        
        if(req.url.endsWith('.wasm')) {
            res.setHeader('content-type', 'application/wasm')
        }

        if(cache[req.url] && !isDev) {
            res.end(cache[req.url])
            return
        }

        fsPromises.readFile(path.resolve(publicDir, req.url.substring(1)))
            .then((buffer) => {
                res.end(buffer)
                cache[req.url] = buffer
            })
            .catch((_) => {
                if (req.url === undefined) throw new Error("req.url is undefined")

                fsPromises.readFile(path.resolve(publicDir, req.url.substring(1), 'index.html'))
                    .then((buffer) => {
                        res.end(buffer)
                        cache[req.url] = buffer
                    })
                    .catch((_) => {
                        res.writeHead(404)
                        res.end("404 Not Found")
                    })
        })
    })

    server.listen(port, hostname, () => {
        const address = server.address()
        if (address === null) {
            throw new Error("server.address() is null")
        }
        if (typeof address === 'string') {
            throw new Error("server.address() is a string, which is not expected")
        }
        console.log(`Listening on ${hostname}:${address.port}`)
    })
}
