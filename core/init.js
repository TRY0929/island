const requireDirectory = require('require-directory')
const Router = require('koa-router')

class InitManager {
  static initCore (app) {
    InitManager.app = app
    InitManager.initLoadRouter()
    InitManager.loadConfig()
    InitManager.loadHttpException()
  }

  static initLoadRouter () {
    requireDirectory(module, `${process.cwd()}/app/api`, {visit: visitFunction})
    function visitFunction (obj) {
      if (obj instanceof Router) {
        InitManager.app.use(obj.routes())
      }
    }
  }
  static loadConfig (path="") {
    const configPath = path || process.cwd() + '/config/config.js'
    const config = require(configPath)
    global.config = config
  }
  static loadHttpException () {
    // const {HttpException, ParameterException, Success} = require('../core/http-exception')
    global.errs = require('../core/http-exception')
  }
}

module.exports = InitManager