const Router = require('koa-router')

const {User} = require('../../models/user')

const router = new Router({
  prefix: '/v1/user'
})

const {RegisterValidator} = require('../../validators/validator')

router.post('/register', async (ctx, next) => {
  const v = await new RegisterValidator().validate(ctx)

  const user = {
    email: v.get('body.email'),
    password: v.get('body.password1'),
    nickname: v.get('body.nickname')
  }
  const result = await User.create(user)
  throw new global.errs.Success()
})

module.exports = router