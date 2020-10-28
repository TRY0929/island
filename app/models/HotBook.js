const {sequelize} = require('../../core/db')
const {Sequelize, Model, Op} = require('sequelize')
const { Favor } = require('./favor')

// 先将hot_book书架中书取出来，再看favor中关于每本hot_book有几条喜欢的数据
// 计算出来返回
class HotBook extends Model {
  static async getAll () {
    const books = await HotBook.findAll()
    const ids = []
    books.forEach(item => {
      ids.push(item.id)
    })
    const favors = await Favor.findAll({
      where: {
        art_id: {
          [Op.in]: ids
        },
        type: 400
      },
      group: ['art_id'],
      attributes: ['art_id', [Sequelize.fn('COUNT', '*'), 'count']]
    })
    books.forEach(book => {
      book.setDataValue('count', HotBook._getBookStatus(book, favors))
    })
    return books
  }

  static _getBookStatus (book, favors) {
    const fs = favors.filter(favor => book.id === favor.art_id)
    if (fs.length === 0) {
      return 0
    }
    return parseInt(fs[0].get('count'))
  }
}

HotBook.init({
  index: Sequelize.INTEGER,
  image: Sequelize.STRING,
  author: Sequelize.STRING,
  title: Sequelize.STRING
}, {
  sequelize,
  tableName: 'hot_book'
})

module.exports = {
  HotBook
}