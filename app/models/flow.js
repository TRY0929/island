const {sequelize} = require('../../core/db')
const {Sequelize, Model} = require('sequelize')
const {Art} = require('./art')
const {Favor} = require('./favor')

class Flow extends Model {
  static async getLatest () {
    let res = await Flow.findOne({
      order: [
        ['index', 'DESC']
      ]
    })
    if (!res) {
      throw new global.errs.NotFound()
    }
    const art = await Art.getData(res.art_id, res.type)
    if (!art) {
      throw new global.errs.NotFound()
    }
    art.setDataValue({
      index: res.index
    })
    return art
  }

  static async getFavor (art_id, type) {
    const res = await Flow.findOne({
      where: {
        art_id,
        type
      }
    })
    if (!res) {
      throw new global.errs.NotFound()
    }
    const art = await Art.getData(art_id, type)
    const like_status = await Favor.likeOrDislike(art_id, type, uid)
    const favor = {
      fav_nums: art.fav_nums,
      id: art_id,
      like_status
    }
    ctx.body = favor
  }
}

Flow.init({
  index: Sequelize.INTEGER,
  art_id: Sequelize.INTEGER,
  type: Sequelize.INTEGER
}, {
  sequelize,
  tableName: 'flow'
})

module.exports = {
  Flow
}