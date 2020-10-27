const {
  Movie,
  Sentence,
  Music
} = require('./classic')

class Art {
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
}

module.exports = {
  Art
}