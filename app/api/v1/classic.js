const Router = require('koa-router')
const { NotFound } = require('../../../core/http-exception')

const {Auth} = require('../../../middlewares/auth')
const { Art } = require('../../models/art')
const { Favor } = require('../../models/favor')
const {Flow} = require('../../models/flow')
const {PositiveIntegerValidator, LikeValidator} = require('../../validators/validator')


const router = new Router({
  prefix: '/v1/classic'
})

router.get('/latest',new Auth().m , async (ctx, next) => {
  ctx.body = await Flow.getLatest()
})

router.get('/:type/:id/favor', new Auth().m , async (ctx, next) => {
  const v = await new LikeValidator().validate(ctx)
  ctx.body = await Flow.getFavor(v.get('path.id'), v.get('path.type'), ctx.auth.uid)
})

router.get('/:index/next', new Auth().m, async (ctx, next) => {
  const v = await new PositiveIntegerValidator().validate(ctx, {id: 'index'})
  const res = await Flow.getNextFlow(v.get('path.index'), ctx.auth.uid)
  res.art.setDataValue('like_status', res.like_status)
  res.art.setDataValue('index', v.get('path.index'))
  // res.art.exclude = ['like_status', 'index']
  ctx.body = res.art
})

router.get('/:index/prev', new Auth().m, async (ctx, next) => {
  const v = await new PositiveIntegerValidator().validate(ctx, {id: 'index'})
  const res = await Flow.getPrevFlow(v.get('path.index'), ctx.auth.uid)
  res.art.setDataValue('like_status', res.like_status)
  res.art.setDataValue('index', v.get('path.index'))
  ctx.body = res.art
})

router.get('/favor', new Auth().m, async (ctx, next) => {
  const res = await Favor.getUserLike(ctx.auth.uid)
  ctx.body = res
})

router.get('/:type/:id', new Auth().m, async (ctx, next) => {
  const v = await new LikeValidator().validate(ctx)
  const id = v.get('path.id')
  const type = v.get('path.type')
  const res = await new Art(parseInt(type), id).getDetail(ctx.auth.uid)
  res.art.setDataValue('like_status', res.like_status)
  ctx.body = res.art
})

module.exports = router
