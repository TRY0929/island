const Router = require('koa-router')
const router = new Router()
const {HttpException, ParameterException} = require('../../../core/http-exception')
const {PositiveIntegerValidator} = require('../../validators/validator')

router.post('/book/:id/hot_list', async (ctx, next) => {
  const v =  await new PositiveIntegerValidator().validate(ctx)
  ctx.body = 'success'
})

module.exports = router
