const { ParameterException } = require('../../core/http-exception')
const {LinValidator, Rule} = require('../../core/lin-validator')
const {User} = require('../modules/user')
const {loginType} = require('../lib/enum')

class PositiveIntegerValidator extends LinValidator {
  constructor () {
    super()
    this.id = [
      new Rule('isInt', '需要正整数', {min: 1})
    ]
  }
}

class RegisterValidator extends LinValidator {
  constructor () {
    // nickname, password1, password2, email
    super()
    this.email = [
      new Rule('isEmail', '输入不符合邮箱规范')
    ]
    this.password1 = [
      new Rule('isLength', '密码最少6个字符，最多32个字符', {
        max: 32,
        min: 6
      }),
      new Rule('matches', '输入不符合规范', '^(?![0-9]+$)(?![a-zA-Z]+$)([0-9a-zA-Z])')
    ]
    this.password2 = this.password1
    this.nickname = [
      new Rule('isLength', '昵称最少6个字符，最多32个字符', {
        max: 32,
        min: 6
      })
    ]
  }

  validatePassword (vals) {
    const psw1 = vals.body.password1
    const psw2 = vals.body.password2
    if (psw1 !== psw2) {
      throw new Error('两次输入密码必须相同')
    }
  }

  async validateEmail (vals) {
    const email = vals.body.email
    const has = await User.findOne({
      where: {
        email
      }
    })
    if (has) {
      throw new ParameterException('两次邮箱不能重复')
    }
  }
}

class TokenValidator extends LinValidator {
  constructor () {
    super()
    this.account = [
      new Rule('isLength', '不符合账号规则', {
        min: 4,
        max: 32
      })
    ]
    this.secret = [
      new Rule('isOptional'),
      new Rule('isLength', '最短6个字符，最长128个字符', {
        min: 6,
        max: 128
      })
    ]
  }

  validateLoginType (vals) {
    const type = vals.body.type
    if (!type) {
      throw new Error('Type是必须的')
    }
    if (!loginType.isThisType(type)) {
      throw new Error('Type不符合规范')
    }
  }
}

class NotEmptyValidator extends LinValidator {
  constructor () {
    super()
    this.token = [
      new Rule('isLength', '不能为空', {min: 1})
    ]
  }
}

module.exports = {
  PositiveIntegerValidator,
  RegisterValidator,
  TokenValidator,
  NotEmptyValidator
}