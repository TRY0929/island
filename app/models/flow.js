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
    art.setDataValue('index', flow.index)
    return art
  }

  static async getFavor (art_id, type, uid) {
    const res = await Flow.findOne({
      where: {
        art_id,
        type
      }
    })
    if (!res) {
      throw new global.errs.NotFound()
    }
    const art = await new Art(parseInt(type), art_id).getDetail(uid)
    if (!art) {
      throw new global.errs.NotFound()
    }
    return {
      fav_nums: art.art.fav_nums,
      id: art_id,
      like_status: art.like_status
    }
  }

  static async getNextFlow (index, uid) {
    const flow = await Flow.findOne({
      where: {
        index: index + 1
      }
    })
    if (!flow) {
      throw new global.errs.NotFound()
    }
    const art = await new Art(flow.type, flow.art_id).getDetail(uid)
    if (!art) {
      throw new global.errs.NotFound()
    }
    return art
  }

  static async getPrevFlow (index, uid) {
    const flow = await Flow.findOne({
      where: {
        index: index - 1
      }
    })
    if (!flow) {
      throw new global.errs.NotFound()
    }
    const art = await new Art(flow.type, flow.art_id).getDetail(uid)
    if (!art) {
      throw new global.errs.NotFound()
    }
    return art
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