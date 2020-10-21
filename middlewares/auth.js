const basicAuth = require('basic-auth')
const jwt = require('jsonwebtoken')

class Auth {
  constructor () {}
  get m () {
    return async (ctx, next) => {
      const errMsg = 'token不合法'
      // ctx.request === koa 对请求封装了
      // ctx.req === 原生的http请求
      const userToken = basicAuth(ctx.req)
      if (!userToken || !userToken.name) {
        throw new global.errs.Forbidden(errMsg)
      }
      try {
        var decode = jwt.verify(userToken.name, global.config.security.secretKey)
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new global.errs.Forbidden('token已过期')
        }
        throw new global.errs.Forbidden(errMsg)
      }
      ctx.auth = {
        uid: decode.uid,
        scope: decode.scope
      }
      await next()
    }
  }
}

module.exports = {
  Auth
}