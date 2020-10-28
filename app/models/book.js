const axios = require('axios')
const util = require('util')
const {sequelize} = require('../../core/db')
const {Sequelize, Model, Op} = require('sequelize')
const { Favor } = require('./favor')

class Book extends Model {
  constructor (id) {
    super()
    this.id = id
  }

  async detail () {
    const url = util.format(global.config.yushu.detailUrl, this.id)
    const res = await axios.get(url)
    return res.data
  }

  static async searchFromYushu (q, count, start, summary=1) {{
    const url = util.format(global.config.yushu.detailUrl, encodeURI(q), count, start, summary)
    const res = await axios.get(url)
    return res.data
  }}

  static async getMyFavorBookCount (uid) {
    const count = Favor.count({
      where: {
        type: 400,
        uid
      }
    })
    return count
  }
}

Book.init({
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  fav_nums: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  tableName: 'book'
})

module.exports = {
  Book
}