# noer

Simple node webserver

https://github.com/alexsch01/noer

<br>

### Calculator Example

public/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculator</title>

    <script>
        window.onload = function() {
            const forms = document.querySelectorAll('form[class="noerForm"]')
            for (const form of forms) {
                form.onsubmit = async (e) => {
                    e.preventDefault()
                    const data = Object.fromEntries(new FormData(e.target).entries())
                    console.log(data)

                    const resp = await fetch(window.location.href, {
                        method: 'POST',
                        body: JSON.stringify(data),
                    })
                    const html = await resp.text()

                    document.open()
                    document.write(html)
                    document.close()
                }
            }
        }
    </script>
</head>
<body>
    <h1>Calculator</h1>
    <form class="noerForm">
        <input name="left">
        <input name="right">
        <input name="action" value="add" hidden>
        <button>Add</button>
    </form>
    <br>
    <form class="noerForm">
        <input name="left">
        <input name="right">
        <input name="action" value="subtract" hidden>
        <button>Subtract</button>
    </form>
    <br>
    <form class="noerForm">
        <input name="left">
        <input name="right">
        <input name="action" value="multiply" hidden>
        <button>Multiply</button>
    </form>
    <br>
    <form class="noerForm">
        <input name="left">
        <input name="right">
        <input name="action" value="divide" hidden>
        <button>Divide</button>
    </form>
    @{results}
</body>
</html>
```

server.js
```js
const noer = require('noer')

noer('public/', [8080], (serveHTML, data) => {
    let answer, operator
    const left = parseFloat(data.left)
    const right = parseFloat(data.right)

    if(data.action === 'add') {
        answer = left + right
        operator = '+'
    }
    if(data.action === 'subtract') {
        answer = left - right
        operator = '-'
    }
    if(data.action === 'multiply') {
        answer = left * right
        operator = 'x'
    }
    if(data.action === 'divide') {
        answer = left / right
        operator = '/'
    }

    if(Number.isFinite(answer)) {
        serveHTML({results: `<p>${left} ${operator} ${right} = ${answer}</p>`})
    }
})
```

#### How To Run
A file gets read from storage on the first call, then subsequent calls to this file use memory
```
node server.js
```
In a web browser, go to http://localhost:8080

#### Dev Mode
A file gets read from storage on all calls
```
node server.js --dev
```
In a web browser, go to http://localhost:8080
