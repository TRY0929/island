const { sequelize } = require('../../core/db')
const { Sequelize, Model, Op } = require('sequelize')
const { Art } = require('../models/art')

const {
  LikeError,
  DislikeError,
  NotFound
} = require('../../core/http-exception')

class Favor extends Model {
  static async like(art_id, type, uid) {
    const favor = await Favor.findOne({
      where: {
        art_id, type, uid
      }
    })
    if (favor) {
      throw new LikeError()
    }
    return sequelize.transaction(async t => {
      await Favor.create({
        art_id, type, uid
      }, { transaction: t })
      const art = await Art.getData(art_id, type)
      await art.increment('fav_nums', { by: 1, transaction: t })
    })
  }

  static async dislike(art_id, type, uid) {
    const favor = await Favor.findOne({
      where: {
        art_id, type, uid
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
      const art = await Art.getData(art_id, type)
      await art.decrement('fav_nums', { by: 1, transaction: t })
    })
  }

  static async likeOrDislike(id, type, uid) {
    const res = await Favor.findOne({
      where: {
        art_id: id, type, uid
      }
    })
    if (!res) {
      return 0
    } else {
      return 1
    }
  }

  static async getUserLike(uid) {
    const res = await Favor.findAll({
      where: {
        uid,
        type: {
          [Op.not]: 400
        }
      }
    })
    if (!res) {
      return null
    }
    const arts = await Art.getList(res)
    return arts
  }

  static async getBookFavor(uid, book_id) {
    const count = await Favor.count({
      where: {
        type: 400,
        art_id: book_id
      }
    })
    const status = await Favor.likeOrDislike(book_id, 400, uid)
    return {
      fav_nums: count || 0,
      like_status: status,
      id: book_id
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