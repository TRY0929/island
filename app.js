const Koa = require('koa')
const path = require('path')
const static = require('koa-static')
const InitManager = require('./core/init')
const parser = require('koa-bodyparser')
const catchError = require('./middlewares/exceptions')

const app = new Koa()

app.use(catchError)
app.use(parser())
app.use(static(path.join(__dirname, './static')))
InitManager.initCore(app)

app.listen(3000)
