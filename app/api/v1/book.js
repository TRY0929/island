const Router = require('koa-router')
const {HttpException, ParameterException} = require('../../../core/http-exception')
const {PositiveIntegerValidator, SearchValidator, CommentValidator} = require('../../validators/validator')
const { Auth } = require('../../../middlewares/auth')
const {Favor} = require('../../models/favor')
const {HotBook} = require('../../models/HotBook')
const {Book} = require('../../models/book')
const {Comment} = require('../../models/comment')


const router = new Router({
  prefix: '/v1/book'
})

router.get('/hot_list', new Auth().m, async (ctx, next) => {
  const books = await HotBook.getAll()
  ctx.body = {
    books
  }
})

router.get('/:id/detail', new Auth().m, async (ctx, next) => {
  const v = await new PositiveIntegerValidator().validate(ctx)
  const book = await new Book(v.get('path.id'))
  ctx.body = await book.detail()
})

router.get('/search', new Auth().m, async (ctx, next) => {
  const v = await new SearchValidator().validate(ctx)
  const book = await Book.searchFromYushu(v.get('query.q'), v.get('query.count'), v.get('query.start'))
  ctx.body = book
})

router.get('/favor/count', new Auth().m, async (ctx, next) => {
  const count = await Book.getMyFavorBookCount(ctx.auth.uid)
  ctx.body = {
    count
  }
})

router.get('/:book_id/favor', new Auth().m, async (ctx, next) => {
  const v = await new PositiveIntegerValidator().validate(ctx, {id: 'book_id'})
  const res = await Favor.getBookFavor(ctx.auth.uid, v.get('path.book_id'))
  ctx.body = res
})

router.post('/add/comment', new Auth().m, async (ctx, next) => {
  const v = await new CommentValidator().validate(ctx, {id: 'book_id'})
  await Comment.addComment(v.get('body.content'), v.get('body.book_id'))
  throw new global.errs.Success()
})

router.get('/:book_id/short_comment', new Auth().m, async (ctx, next) => {
  const v = await new PositiveIntegerValidator().validate(ctx, {id: 'book_id'})
  const res = await Comment.getComment(v.get('path.book_id'))
  if (!res) {
    throw new global.errs.Notfound()
  }
  res.exclude = ['content']
  ctx.body = res
})

module.exports = router
