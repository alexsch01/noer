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
</head>
<body>
    <h1>Calculator</h1>
    <form method="post">
        <input name="left">
        <input name="right">
        <button name="add">Add</button>
    </form>
    <br>
    <form method="post">
        <input name="left">
        <input name="right">
        <button name="subtract">Subtract</button>
    </form>
    <br>
    <form method="post">
        <input name="left">
        <input name="right">
        <button name="multiply">Multiply</button>
    </form>
    <br>
    <form method="post">
        <input name="left">
        <input name="right">
        <button name="divide">Divide</button>
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

    if('add' in data) {
        answer = left + right
        operator = '+'
    }
    if('subtract' in data) {
        answer = left - right
        operator = '-'
    }
    if('multiply' in data) {
        answer = left * right
        operator = 'x'
    }
    if('divide' in data) {
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
