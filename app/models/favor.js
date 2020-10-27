const {sequelize} = require('../../core/db')
const {Sequelize, Model} = require('sequelize')
const {Art} = require('../models/art')

const {
  LikeError,
  DislikeError
} = require('../../core/http-exception')

class Favor extends Model {
  static async like (id, type, uid) {
    const favor = await Favor.scope().findOne({
      where: {
        id, type, uid
      }
    })
    if (favor) {
      throw new LikeError()
    }
    return sequelize.transaction(async t => {
      await Favor.create({
        id, type, uid
      }, {transaction: t})
      const art = await Art.getData(id, type)
      await art.increment('fav_nums', {by:1, transaction: t})
    })
  }

  static async dislike (id, type, uid) {
    const favor = await Favor.findOne({
      where: {
        id, type, uid
      }
    })
    if (!favor) {
      throw new DislikeError()
    }
    return sequelize.transaction(async t => {
      await favor.destroy({
        force: true,
        transaction: t
      })
      const art = await Art.getData(id, type)
      await art.decrement('fav_nums', {by:1, transaction: t})
    })
  }

  static async likeOrDislike (id, type, uid) {
    const res = await Favor.findOne({
      where: {
        id, type, uid
      }
    })
    if (!res) {
      return 0
    } else {
      return 1
    }
  }

}

Favor.init({
  uid: Sequelize.STRING,
  art_id: Sequelize.INTEGER,
  type: Sequelize.INTEGER
}, {
  sequelize,
  tableName: 'favor'
})

module.exports = {
  Favor
}