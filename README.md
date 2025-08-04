# noer

Simple node webserver

https://github.com/alexsch01/noer

<br>

### Calculator Example

---

**public/index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculator</title>
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
    <p id="results"></p>

    <script type="module" src="index.js"></script>
</body>
</html>
```

**public/index.js**
```js
const forms = document.querySelectorAll('form[class="noerForm"]')
for (const form of forms) {
    form.onsubmit = async (e) => {
        e.preventDefault()
        const data = Object.fromEntries(new FormData(e.target).entries())

        document.querySelectorAll('[name="left"]').forEach(elem => {
            elem.value = ''
        })
        document.querySelectorAll('[name="right"]').forEach(elem => {
            elem.value = ''
        })

        let json
        try {
            const resp = await fetch('/getData', {
                method: 'POST',
                body: JSON.stringify(data),
            })
            json = await resp.json()
        } catch(_) {}

        if (json === undefined) {
            document.querySelector('[id="results"]').innerHTML = 'Uh oh - check your server'
            return
        }

        document.querySelector('[id="results"]').innerHTML = json.results
    }
}
```

**server.js**
```js
//@ts-check
const noer = require('noer')

noer({
    publicDir: 'public/',
    port: 8080,
    routes: {
        '/getData': async (data) => {
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

            let results = ''
            if(Number.isFinite(answer)) {
                results = `${left} ${operator} ${right} = ${answer}`
            }

            return JSON.stringify({ results })
        }
    }
})
```

---

#### How To Run
Files in the `publicDir` directory are cached before the server is created
```
node server.js
```

#### Dev Mode
Files in the `publicDir` directory are read from storage every load
```
node server.js --dev
```

---

In a web browser, go to http://localhost:8080
