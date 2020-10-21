const bcrypt = require('bcryptjs')


const {sequelize} = require('../../core/db')
const {Sequelize, Model} = require('sequelize')

class User extends Model {
    static async verifyEmailPassword (email, secret) {
      // 数据库查询是个异步操作 也要加await
      const res = await User.findOne({
        where: {
          email
        }
      })
      if (!res) {
        throw new global.errs.NotFound('账号不存在')
      }
      const correct = bcrypt.compareSync(secret, res.password)
      if (!correct) {
        throw new global.errs.AuthorFailed('密码不正确')
      }
      return res
    }
}


User.init({
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nickname: Sequelize.STRING,
  email: {
    type: Sequelize.STRING,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    set (val) {
      const salt = bcrypt.genSaltSync(10)
      const psw = bcrypt.hashSync(val, salt)
      this.setDataValue('password', psw)
    }
  },
  openid: {
    type: Sequelize.STRING,
    unique: true
  },
  test1: Sequelize.STRING
}, {sequelize})

module.exports = {User}