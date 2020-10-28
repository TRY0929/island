const { ParameterException } = require('../../core/http-exception')
const {LinValidator, Rule} = require('../../core/lin-validator')
const {User} = require('../models/user')
const {loginType, artType} = require('../lib/enum')

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
    const checker = new Checker(loginType)
    this.validateLoginType = checker.checkType.bind(checker)
    // this.validateLoginType = checkType
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

class Checker {
  constructor (type) {
    this.enumType = type
  }
  checkType (vals) {
    let type = vals.body.type || vals.path.type
    if (!type) {
      throw new Error('Type是必须的')
    }
    type = parseInt(type)
    if (!this.enumType.isThisType(type)) {
      throw new Error('Type不符合规范')
    }
  }
}

class LikeValidator extends PositiveIntegerValidator {
  constructor () {
    super()
    const checker = new Checker(artType)
    this.validateType = new Checker(artType).checkType.bind(checker)
  }
}

class SearchValidator extends LinValidator {
  constructor () {
    super()
    this.q = [
      new Rule('isLength', '搜索关键字不能为空', {
        max: 16,
        min: 1
      })
    ]
    this.start = [
      new Rule('isInt', 'start不符合规范', {
        max: 60000,
        min: 0
      }),
      new Rule('isOptional', '', 0)
    ]
    this.count = [
      new Rule('isInt', 'count不符合规范', {
        min: 1,
        max: 20
      }),
      new Rule('isOptional', '', 20)
    ]
  }
}

class CommentValidator extends PositiveIntegerValidator {
  constructor() {
    super()
    this.content = [
      new Rule('isLength', '长度不符合规范', {
        max: 12,
        min: 1
      })
    ]
  }
}

module.exports = {
  PositiveIntegerValidator,
  RegisterValidator,
  TokenValidator,
  NotEmptyValidator,
  LikeValidator,
  SearchValidator,
  CommentValidator
}