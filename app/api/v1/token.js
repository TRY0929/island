const Router = require('koa-router')

const {TokenValidator, NotEmptyValidator} = require('../../validators/validator')

const {loginType} = require('../../lib/enum')
const { User } = require('../../models/user')
const {generateToken} = require('../../../core/util')
const {Auth} = require('../../../middlewares/auth')
const {WXManager} = require("../../services/wx")

const router = new Router({
  prefix: '/v1/token'
})

router.post('/', async (ctx, next) => {
  const v = await new TokenValidator().validate(ctx)
  const type = v.get('body.type')
  const account = v.get('body.account')
  const secret = v.get('body.secret')
  let token
  switch (type) {
    case loginType.USER_EMAIL:
      token = await emailLogin(account, secret)
      ctx.body = token
      break
    case loginType.USER_MINI_PROGRAM:
      ctx.body = await WXManager.codeToToken(v.get('body.account'))
      break
    default:
      throw new global.errs.ParameterException('没有相应的处理函数')
  }
})

router.post('/verify', async (ctx, next) => {
  const v = await new NotEmptyValidator().validate(ctx)
  ctx.body = {
    is_valid: Auth.verifyToken(v.get('body.token'))
  }
  await next()
})

async function emailLogin (account, secret) {
  const res = await User.verifyEmailPassword(account, secret)
  const token = generateToken(res.id, Auth.USER)
  return token
}

module.exports = router