const { default: Axios } = require('axios')
const util = require('util')
const axios = require('axios')
const {User} = require('../modules/user')
const { generateToken } = require('../../core/util')
const {Auth} = require("../../middlewares/auth")


class WXManager {
  static async codeToToken (code) {
    const loginUrl = util.format(global.config.wx.url, global.config.wx.appId, global.config.wx.appSecret, code)
    const result = await axios.get(loginUrl)
    if (result.status !== 200) {
      throw new global.errs.AuthorFailed('openid获取失败')
    }
    if (result.data.errcode) {
      throw new global.errs.AuthorFailed('openid获取失败' + result.data.errmsg)
    }
    const openid = result.data.openid
    const user = await User.getUserByOpenid(openid)
    if (!user) {
      user = await User.registerByOpenid(openid)
    }
    return generateToken(user.id, Auth.USER)
  }
}

module.exports = {
  WXManager
}