const Router = require('koa-router')

const {Auth} = require('../../../middlewares/auth')
const {Flow} = require('../../models/flow')
const {PositiveIntegerValidator} = require('../../validators/validator')


const router = new Router({
  prefix: '/v1/classic'
})

router.get('/latest',new Auth().m , async (ctx, next) => {
  ctx.body = await Flow.getLatest()
})

router.get('/:type/:id/favor', new Auth().m , async (ctx, next) => {
  const v = await new LikeValidator().validate(ctx)
  await Flow.getFavor(v.get('path.id'), v.get('path.type'))
})

module.exports = router
