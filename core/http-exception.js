class HttpException extends Error {
  constructor (msg="啊哦，出现了一个错误", error_code=10000, code=200) {
    // Class中的 super()，它在这里表示父类的构造函数，用来新建父类的 this 对象
    super()
    this.msg = msg
    this.errorCode = error_code
    this.code = code
  }
}

class ParameterException extends HttpException {
  constructor (msg, error_code, code) {
    super()
    this.msg = msg || '参数错误'
    this.errorCode = error_code || 10000
    this.code = 400 || code
  }
}

class Success extends HttpException {
  constructor (msg, error_code, code) {
    super()
    this.msg = msg || 'ok'
    this.errorCode = error_code || 0
    this.code = 201 || code
  }
}

class NotFound extends HttpException {
  constructor (msg, error_code, code) {
    super()
    this.msg = msg || '资源未找到'
    this.errorCode = error_code || 10000
    this.code = code || 404
  }
}

class AuthorFailed extends HttpException {
  constructor (msg, error_code, code) {
    super()
    this.msg = msg || '授权失败'
    this.errorCode = error_code || 10004
    this.code = code || 401
  }
}

class Forbidden extends HttpException {
  constructor (msg, error_code, code) {
    super()
    this.msg = msg || '禁止访问'
    this.errorCode = error_code || 10006
    this.code = code || 403
  }
}

module.exports = {
  HttpException,
  ParameterException,
  Success,
  NotFound,
  AuthorFailed,
  Forbidden
}