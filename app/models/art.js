const { flatten } = require('lodash')
const {
  Movie,
  Sentence,
  Music
} = require('./classic')

class Art {

  constructor (type, art_id) {
    this.type = type
    this.art_id = art_id
  }

  async getDetail (uid) {
    const {Favor} = require('./favor')
    const art = await Art.getData(this.art_id, this.type)
    const like_status = await Favor.likeOrDislike(this.art_id, this.type, uid)
    return {
      art,
      like_status
    }
  }

  static async getData (id, type) {
    const finder = {
      where: {
        id
      }
    }
    let res
    switch (type) {
      case 100:
        res = await Movie.findOne(finder)
        break
      case 200:
        res = await Music.findOne(finder)
        break
      case 300:
        res = await Sentence.findOne(finder)
        break
      case 400:
        break
      default:
        break
    }
    if (!res) {
      throw new global.errs.NotFound()
    }
    return res
  }

  static async getList (artInfoList) {
    const arts = {
      100: [],
      200: [],
      300: []
    }
    for (let artInfo of artInfoList) {
      arts[artInfo.type].push(artInfo.art_id)
    }
    let res = []
    for (let key in arts) {
      if (key.length === 0) {
        continue
      }
      res.push(await this._getListType(arts[key], parseInt(key)))
    }
    res = flatten(res)
    return res
  }

  static async _getListType (ids, key) {
    let res
    const finder = {
      where: {
        id: ids
      }
    }
    switch (key) {
      case 100:
        res = await Movie.findAll(finder)
        break
      case 200:
        res = await Music.findAll(finder)
        break;
      case 300:
        res = await Sentence.findAll(finder)
        break
      default:
        break
    }
    return res
  }
}

module.exports = {
  Art
}