const { sequelize } = require('../../core/db')
const { Sequelize, Model, Op } = require('sequelize')

class Comment extends Model {
  static async addComment (content, book_id) {
    const cmt = await Comment.findOne({
      where: {
        content,
        book_id
      }
    })
    if (cmt) {
      await cmt.increment('num', {by: 1})
    } else {
      await Comment.create({
        content,
        book_id,
        num: 1
      })
    }
  }

  static async getComment (book_id) {
    const res = await Comment.findAll({
      where: {
        book_id
      }
    })
    return res
  }
  // toJSON () {
  //   return {
  //     content: this.getDataValue('content'),
  //     num: this.getDataValue('num')
  //   }
  // }
}

Comment.init({
  content: {
    type: Sequelize.STRING(12)
  },
  num: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  book_id: Sequelize.INTEGER
}, {
  sequelize,
  tableName: 'comment'
})

module.exports = {
  Comment
}