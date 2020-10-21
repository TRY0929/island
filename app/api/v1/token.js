const Router = require('koa-router')

const {TokenValidator} = require('../../validators/validator')

const {loginType} = require('../../lib/enum')
const { User } = require('../../modules/user')
const {generateToken} = require('../../../core/util')

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
      break
    default:
      throw new global.errs.ParameterException('没有相应的处理函数')
  }
})

async function emailLogin (account, secret) {
  const res = await User.verifyEmailPassword(account, secret)
  const token = generateToken(res.id, 2)
  return token
}

module.exports = router