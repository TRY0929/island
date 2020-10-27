const Router = require('koa-router')
const {HttpException, ParameterException} = require('../../../core/http-exception')
const {PositiveIntegerValidator} = require('../../validators/validator')
const { Auth } = require('../../../middlewares/auth')
const {Favor} = require('../../models/favor')

const router = new Router({
  prefix: '/v1/book'
})

router.post('/count', new Auth().m, async (ctx, next) => {
  const res = Favor.findOne({
    where: {
    }
  })
})

module.exports = router
