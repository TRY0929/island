# 服务端编程

## 零、初识服务器编程

+ 服务器编程一般由python、Java、nodejs等，但前端一般使用的都是nodejs来写
+ nodejs就是**可以让JavaScript脱离浏览器运行**，之前的js只能在浏览器中运行，就不能做一些关于资源文件的操作，现在可以脱离浏览器就可以有更多的可能性，nodejs就可

+ 绝大多数后端都在：
  + 读写数据库：前端是不能直接在数据库中取出数据的
  + 编写API：给前端使用来拿到数据

+ 一般有 commonJS（同步 服务器）、AMD（异步 浏览器）、promise

## 一、koa

### koa基本使用

  其实官网都说的挺好的了，就说下现在要用的一些操作吧：

Koa 应用程序是一个包含一组中间件函数的对象，它是按照类似堆栈的方式组织和执行的

1. 导入koa：`const Koa = require('koa')`：注意这里要用ES5的require方式导入，而不用ES6的import方式
2. 实例化koa对象：`const app = new Koa()`
3. koa对象的listen方法来监听某个服务器：`app.listen(3000)`，这里是监听3000端口
4. 注册中间件函数`koa.use(中间件函数名)`

### 中间件函数

+ 在koa中，要想在用户对服务器发起请求时做点什么，就要写在中间件函数里（类似于 响应时的动作）

+ **若注册了多个中间件，则运行它们的运行顺序遵循——洋葱模型**，但这也是要有条件的，洋葱模型是最容易想到和理解的模型，所以只要遵循它就可使问题变得简单一些，条件就是**加上async和await标识**

  + async和await标识细节就不多说了，这两个标识符就是为了让函数能够**同步**的执行代码，不会出现意料之外的结果 详见

    [promise和async、await]: https://www.cnblogs.com/TRY0929/p/13229105.html

+ 中间件常见写法如下，ctx是上下文信息，里面包含了请求的所有信息(如这里是path是路径，method是请求方式)，next是下一个中间件函数

```javascript
app.use((ctx, next) => {
  if (ctx.path === '/classic/latest' && ctx.method === 'GET') {
    console.log('123')
  }
  next()
})
```

### koa-router 路由库

+ koa-router可以处理客户向服务器发送的请求，其实这就是个路由中间件;
+ 先引入koa-router模块，再进行实例化，例子如下：

```javascript
const Router = require('koa-router')
const router = new Router()

// 写法一
router.get('/book/hot_list', async (ctx, next) => {
  ctx.body = '/book/hot_list'
})

// 写法二
app.use((ctx, next) => {
  if (ctx.path === '/book/hot_list' && ctx.method === 'GET') {
    ctx.body = '/book/hot_list'
  }
  next()
})
```

+ 上面例子中的两种写法含义是一样的，但上面那种就有助于模块化、更加清晰直观，且不用把所有的判断都放在一个文件里；
+ 同时router实例还有post、put、get等方法，对应http各种请求方式



## 二、异常处理

+ 在服务端编程的时候注意要进行异常的处理，当某处出现错误的时候要及时捕捉
+ 通常异常处理分为两步：
  + 监听错误
  + 输出给客户端一段有意义的信息（错误提示）
+ 通常在服务端捕捉到的错误不会直接返回给客户端，捕捉到的错误包含了 堆栈调用信息，而要返回的是简介明了的错误提示信息
  + message：错误信息文本
  + error_code：后端自己设置的在不同情况下发出的错误码，前端会通过error_code的不同数字来判断不同错误
  + request_url：当前请求的url
+ 通常错误可以分为：
  + 已知错误：如输入url的参数校验出现错误（即可以预知的错误）
  + 未知错误：程序潜在错误，如用户输入数据库密码时输错了（很难预知的错误）

### 捕获错误

+ 肯定是要用try..catch语句来捕获错误的，但错误的捕获一定要先保证程序是在**同步**的顺序下运行，异步的时候错误捕捉不到
+ 那如何保证在一系列函数链式调用的时候让每个函数都是同步的方式运行？**答案显示是利用promise、async、await来实现**

+ 这里可以使用**面向切面编程（AOP）**，也就是在整个函数调用链最上面再写一个函数来起始 捕捉整个链上出现的错误，并且在另一个文件里写上对该错误的处理逻辑
+ 这里是在中间件函数里出现错误时抛出异常，然后在 middlewares/exceptions.js 文件里统一写处理错误逻辑，注意这个文件里的函数要：
  + 在最先被注册，并且调用next
  + 一定要是async函数，且调用next时要写await，都要保证程序是同步运行的

```javascript
const catchError = async (ctx, next) => {
  try {
    // 确定下一个中间件函数要继续执行下去
    await next()
  } catch (error) {
    if (error.error_code) {
    // 判断一下是否是已知错误
      error.requestUrl = `${ctx.method} ${ctx.path}`
      ctx.body = {
        msg: error.msg,
        code: error.code,
        requestUrl: error.requestUrl
      }
      ctx.code = error.code
    }
  }
}
```

### 定义HttpException异常基类

+ 由于是要throw出一个错误，里面要包含所有错误信息，因此是要new一个Error类然后在里面添加信息的，现在将这个过程封装成一个HttpException异常类，里面专门存放有关的异常信息
+ 这个类继承js的原生Error类

```javascript
class HttpException extends Error {
  constructor (msg="啊哦，出现了一个错误", error_code=10000, code=200) {
    // Class中的 super()，它在这里表示父类的构造函数，用来新建父类的 this 对象
    super()
    this.msg = msg
    this.error_code = error_code
    this.code = code
  }
}
module.exports = HttpException
```

+ 后续在中间件函数里要抛出异常的时候，就引入这个文件，并且抛出HttpException类型的错误就好了，并传递参数

+ 可能有人会发现，欸这HttpException怎么还是基类？因为后续各种特定的错误还要定制属于自己的特殊类（很多哦），这样在创建抛出错误的时候都不太需要传参了，例如参数错误类

```javascript
class ParameterException extends HttpException {
  constructor (msg, error_code, code) {
    super()
    this.msg = msg || '参数错误'
    this.error_code = error_code || 10000
    this.code = 400 || code
  }
}
```

## 三、校验器（Lin-Validator）

+ 由于koa真的非常精简，所以很多功能都需要自己封装文件去实现，现在要用的校验功能也一样，这里使用给定的校验器Lin-Validator（七月老师自己写的）
  + 起始这里说到的校验功能，就是类似于 传参的时候要传正整数 等情况，不做约束的话拿到所有参数没法处理，传参错误则报错
+ 将lin-validator.js和util.js放到core文件夹下，在app下添加validator文件夹，里面专门放和校验有关的代码

### 创建校验器

+ 在validator文件夹下写validator.js文件，先拿限制正整数的校验器为例：
  + 创建PositiveIntegerValidator类，继承LinValidator类（要引入LinValidator和Rule两个类）
  + 构造函数里写上要校验的规则和校验失败时的错误信息

```javascript
class PositiveIntegerValidator extends LinValidator {
  constructor () {
    super()
    this.id = [
      // 规则可以叠加，是 且 的关系
      new Rule('isInt', '需要正整数', {min: 1})
    ]
  }
}
```

### 使用校验器

+ 在要使用的文件里，像这样创建一个对象 调用validate函数将上下文信息传递进去

```javascript
const v =  await new PositiveIntegerValidator().validate(ctx)
```

+ 这里的await和async的错误找了好久... 控制台总是报错说Promise的reject未进行处理，但明明已经写了try...catch逻辑，原来还是因为**try...catch只能捕获同步的错误**，这里用await和async来让代码同步执行
+ 注意在校验的时候，如果要拿到请求body里的数据，一定要在挂载中间件之前就引入koa-bodyparse，不然拿不到body（body为undefined）
+ 校验器这里返回的v对象，不加await的话返回的是Promise对象，加上了就能将promise的值求出来，这里通过v可以直接获取当前请求中的信息，比如：
  + 要获取body中传过来的email，`v.get('body.email')`
  + 要获取header中传过来的token，`v.get('header.token')`

## 四、环境配置

+ 由于在服务器编程时，错误信息一旦被catch了就看不到了，也就没办法进行处理，所以调试的时候还是要将error给throw出来
+ 但真正项目上线之后，错误是不能直接展现给用户的，因此**要区分生产环境和开发环境**，根据不同的环境来选择某些输出操作进不进行
+ 这里在根目录下创建config文件夹里面放着环境变量的相关文件，dev是开发环境，prod是生产环境
+ **在init里将环境变量导入到全局（global）**，要注意路径的问题（这里又再一次用到了process.cwd()函数来获取当前的绝对路径）
+ 从此在每一个输出调试信息的地方都先判断当前是在什么环境下运行

## 五、数据库

### 前端发送api请求的流程

![image-20201020203326862](C:\Users\ARASHI\AppData\Roaming\Typora\typora-user-images\image-20201020203326862.png)

+ 通过API发送请求，到model进行业务处理，将数据存到或在MYSQL查询，将数据一并给KOA服务器请求，最后将请求的结果返回给客户端

### 关系型数据库、非关系型数据库

#### 关系型数据库

**mysql /oracle/sql server/sqlite**
我还有一篇文章 介绍了 关系型数据库和非关系型数据的数据结构 –**红黑树-二叉树-B树**

**1.首先了解一下 什么是关系型数据库？**
关系型数据库最典型的**数据结构是表**，由**二维表**及其**之间的联系**所组成的一个数据组
织。
**优点：**
1、**易于维护**：都是使用表结构，**格式一致**；
2、**使用方便**：**SQL语言通用**，可用于复杂查询；
3、**复杂操作**：**支持SQL**，可用于一个表以及多个表之间非常复杂的查询。
**缺点：**
1、**读写性能比较差**，尤其是海量数据的高效率读写；
2、固定的表结构，**灵活度稍欠**；
3、高并发读写需求，传统关系型数据库来说，**硬盘I/O是一个很大的瓶颈**。

#### 非关系型数据库

redis / hbase /mongoDB /CouchDB /Neo4J

**什么非关系型数据库呢？**

非关系型数据库严格上不是一**加粗样式**种数据库，应该**是一种数据结构化存储方法的集合，可以是文档或者键值对等**

**优点：**
1、**格式灵活**：存储数据的格式**可以是key,value形式、文档形式、图片形式等等**，文档形式、图片形式等等，使用灵活，应用场景广泛，**而关系型数据库则只支持基础类型**。
2、**速度快**：nosql可以使用硬盘或者随机存储器作为载体，而关系型数据库只能使用硬盘；
3、高扩展性；
4、**成本低**：nosql数据库**部署简单**，**基本都是开源软件**。

**缺点：**
1、不提供sql支持，**学习和使用成本较高**；
2、**无事务处理**；
3、**数据结构相对复杂**，复杂查询方面稍欠。

**非关系型数据库的分类和比较：**

1、文档型
2、key-value型
3、列式数据库
4、图形数据库

> [数据库分类]: https://blog.csdn.net/zengxianglei/article/details/94357189
>
> 

## 六、数据库使用

+ 采用的是MySQL+图形化界面 navicat
+ koa采用sequelize插件来连接数据库与程序，并配置一些数据库的相关参数

### 一些基本概念

+ 主键：数据库中一定要有的，且必须满足两个条件：1. 不重复，2. 不为空
+ 这里接下来将使用用户的id编号作为主键，且采用自动增长的方式编号（这样就不重复了），当然也可以自己写一套id编号系统
+ 在微信中，一个用户进入一个小程序的openid是唯一的，但不代表一个用户只有一个openid，用户唯一的只有unionid

### sequelize使用文件

+ 将用户信息等东西都放到config文件里，这个连接数据库的文件放到core/db.js中，这是整个项目连接数据库的文件，后续操作不同表的文件都要引入它
+ 同时在这个文件里也要创建（同步）数据库，调用sequelize的sync函数，当然要通过配置一些参数来选择（如force: true 合并当前数据库等）

```javascript
const Sequelize = require('sequelize')
const {
  dbName,
  host,
  port,
  user,
  password
} = require('../config/config').database

sequelize.sync({force: true})

const sequelize = new Sequelize(dbName, user, password, {
  dialect: 'mysql',
  host,
  port,
  logging: true,
  timezone: '+08:00'
})
```

### 操作数据库

+ 在app/modules下创建user.js文件，用来管理用户的数据库，引入刚刚的db.js文件
+ 里面建立User类继承sequelize中的Model类，调用静态方法init来初始化，设定好一些参数
+ 初始化表中的信息什么的（具体看sequelize官方文档），记得导出哦

```javascript
const {sequelize} = require('../../core/db')
const {Sequelize, Model} = require('sequelize')

class User extends Model {

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
  password: Sequelize.STRING,
  openid: {
    type: Sequelize.STRING,
    unique: true
  },
  test1: Sequelize.STRING
}, {sequelize})

module.exports = {User}
```

+ 之后所有对数据库的增删改查操作都利用Model来进行，也就是这里导出出去的User类
  + 比如插入条目操作，在文件中导入这个文件 moduls/user.js 文件中的User，调用 User.create(对象)即可
  + 还有很多其他操作，具体可以看sequelize官方文档（但返回的都是Promise哦）

### 密码加密（bcrydptjs库）

+ 这时一个用来给密码加密的库，这里说一下基本操作和一点点小原理
+ 先引入bcryptjs库
+ 生成salt盐，这个salt就是用来给密码加密的，中间传入一个参数，默认是10，是加密的成本，越大的话产生的密码安全性就越高 破解时需要的成本也就越高，同时耗费服务器的资源也越多

```javascript
const bcryptjs = require('bcryptjs')
const salt = bcryptjs.genSaltSync(10)
const psw = bcryptjs.hashSync(v.get('body.password1'), salt)
```

+ 且当密码相同的时候，用salt加密出来的密码也是不同的（在一定程度上防范了彩虹攻击）

[bcrydptjs]: https://medium.com/javascript-in-plain-english/how-bcryptjs-works-90ef4cb85bf4

#### 密码加密方法的位置

+ 这里可以选择在获取到password的时候进行加密，但也可以将这个过程直接放到Model（Sequelize下的一个类 专门来进行数据库操作的）中，也就是在 modules/user.js 文件中初始化User类中数据（数据库表中数据）的时候：

```javascript
password: {
    type: Sequelize.STRING,
    set (val) {
      // 这里有一个set方法
      const salt = bcryptjs.genSaltSync(10)
      const psw = bcryptjs.hashSync(val, salt)
      this.setDataValue('password', psw)
    }
  }
```

+ 这里其实用到了观察者模式，一直在看password有没有变化，然后初始化的时候直接调用这个函数了

## 七、登录阶段

### 用户要传入的信息

+ 首先肯定要传入account和secret 也就是账号和密码，但在小程序里登录时不止有一种方式，比如可以直接从微信进去 这样就不需要密码了，因此密码要设置为可选填项
  + 添加对token的api以及TokenValidator校验器

+ 其次还要传入type，也就是进入途径，由于js没有枚举器，所以在api/v1/lib下新建文件enum.js来模拟枚举
  + 其实里面就是一个对象LoginType，其中有各种进入方式(type)对应的值
  + 设置一个isLoginType函数来判断当前的type是否属于里面的值 也就是是否合法；这里要遍历的是对象中的key值，还不太方便... 但可以将函数也定义在enum.js中，并将其放到LoginType对象里，之后都通过对象来调用，就能直接用this拿到所有key值：

```javascript
function isThisType (val) {
  for (let key in this) {
    if (this[key] === val) {
      return true
    }
  }
  return false
}

const loginType = {
  USER_MINI_PROGRAM: 100,
  USER_EMAIL: 101,
  USER_MOBILE: 102,
  ADMIN_EMAIL: 200,
  isThisType
}

module.exports = {
  loginType
}
```

### 验证阶段

用户发送完相应请求后，要做以下几件事情：

+ 检验各项信息是否都按照要求填写，格式符不符合规范：设置一个TokenValidator校验器专门校验登录时的信息
  + 暂时只包括 account、secret、type(进入方式，刚刚说了验证方法)
+ 根据当前进入方式来选择不同的处理函数：用switch...case语句，调用不同的函数
  + 如：当前是用邮箱登录的 即type===LoginType.USER_EMAIL，则调用emailLogin函数（同步的），这个函数写在发送api的token.js文件中（当前文件）
  + emailLogin中调用Model中定义的方法verifyEmailPassword来验证账号密码是否正确：为什么要在Model中定义而不是直接卸载emailLogin中呢，因为这个方法是验证账号密码的，也就是要操控数据库中的数据，因此还是写sequelize中的Model中比较好（注意也要是同步的）
  + verifyEmailPassword中先看数据库中有没有输入的账号（User.findOne()），若不存在直接throw一个NotFound的error，存在的话就看当前输入的密码和数据库中相应密码是否匹配。这里要注意，数据库中保存的是加密的密码 而输入的是明文的，因此要用bcrypt的compareSync方法来判断密码是否匹配正确，不正确就抛出一个AuthorFailed的error
+ 注意以上所有函数要加上async和await让其同步，且返回值基本都是Promise，要得到它的确切返回值一定要在回调函数（.then()）中拿，或者是在前面加上await把promise中的值计算出来

```javascript
// /app/api/v1/token.js
router.post('/', async (ctx, next) => {
  const v = await new TokenValidator().validate(ctx)
  const type = v.get('body.type')
  const account = v.get('body.account')
  const secret = v.get('body.secret')
  switch (type) {
    case loginType.USER_EMAIL:
      await emailLogin(account, secret)
      breakb
    case loginType.USER_MINI_PROGRAM:
      break
    default:
      throw new global.errs.ParameterException('没有相应的处理函数')
  }
})

async function emailLogin (account, secret) {
  const res = await User.verifyEmailPassword(account, secret)
}

// /modules/user.js
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
```

### jwt——Json Web Token

就是一种便于客户端与服务器通信的令牌，详见 

[jwl详解]: https://www.cnblogs.com/TRY0929/p/13855631.html

#### 项目中使用

+ koa项目中引入basic-auth包，在/middlewares/auth.js中写一个Auth类用来校验jwt令牌
+ 引入base-auth中的basicAuth函数，将当前http请求对象传入即可得到token
  + 在koa项目中，中间件中的上下文ctx：ctx.request是被koa封装处理过后的请求对象，而ctx.req才是原生的http请求对象

+ 在要验证的地方，将这个Auth类导入，直接将刚刚写的函数当作中间件导入，注意顺序哦，一定要在执行操作之前就将其导入，这样才能起到截断的作用（在router函数中可以导入多个中间件）
+ Auth类中的校验函数里通过当前发送的http请求获取到token后，大致分为三步
  + 先看token和token.name（内容）是否存在，若不存在直接抛出Forbidden的error
  + 再看token的值是否合法——通过jsonwebtoken中的verify方法，传入两个参数 一个是当前获取到的token，另一个是配置文件中自己写好的secretKey
  + 第二步中的verify方法若错误则会抛出异常，所以要用try...catch语句来调用，其中catch中要查看当前error的名字来区分到底是 token过期 还是token不合法

+ token通过校验成功之后，会返回一个对象，内容就是在生成token的时候自己传进去的第一个参数（想要token携带的信息），可以将其保存到ctx中，在后续中间件都可以使用到

```javascript
  get m () {
    return async (ctx, next) => {
      const errMsg = 'token不合法'
      // ctx.request === koa 对请求封装了
      // ctx.req === 原生的http请求
      const userToken = basicAuth(ctx.req)
      if (!userToken || !userToken.name) {
        throw new global.errs.Forbidden(errMsg)
      }
      try {
        var decode = jwt.verify(userToken.name, global.config.security.secretKey)
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new global.errs.Forbidden('token已过期')
        }
        throw new global.errs.Forbidden(errMsg)
      }
      ctx.auth = {
        uid: decode.uid,
        scope: decode.scope
      }
      await next()
    }
  }
```

### API权限分级控制

在许多项目中，访问人员是有不同级别的区分，普通用户和管理员的权限就不一样，说一下比较简单的实现方式

+ 在生成token的时候就设置了一个参数叫scope，可以用来标识权限大小，意思是权限会随着token走

+ 在Auth类上加上属性，代表不同访问人员的权限高低，这里是Auth.USER = 8, Auth.ADMIN = 16，这是已经固定好的数值
+ 那如何在不同人员访问的时候设定具体的数值？**在Auth中构造函数设置当前实例化对象的权限值**
+ 后续只要在Auth中那个比较token的函数里判断当前实例对象的level和token中的level谁大就好，必须实例对象的大才能访问，不然就抛出Forbidden异常

## 八、登录系统

### 业务逻辑该写到哪

+ 业务逻辑一般也就写到两个地方，一个是直接卸载API接口里，还有一个就是写在提炼出来的Model类里
+ 从代码分层的角度来说，写在Model类里比较好
+ 之前提到的MVC模型，Model View Controller，业务逻辑就应该写在Model里

### 小程序的登录过程

+ 在/app/services/wx.js中再写一个codeToToken类，这是一个更高层次、更抽象的类
+ 小程序登录的话不需要像邮箱登录一样输入账号和密码，而只需要输入code码，而这个码是微信小程序自动生成的 登录的时候传递过来就好，传入这个码之后 要去调用小程序的函数来判断当前用户是否合法
+ 传递之后微信小程序就会返回给用户一个openid，这时独一无二的用来标识不同用户身份的码
+ 和之前email登录不同，它没有一个用账号密码显示注册的过程，所以用来标识身份的就是它的openid，和之前的token不一样
+ 传入的参数总共有：code、appid、appsecret（后两者可以在微信后台查询到，是小程序固定的）

![img](https://res.wx.qq.com/wxdoc/dist/assets/img/api-login.2fcc9f35.jpg)

+ 其实从上面的图应该可以看出来，一开始肯定是要在通过用户传进来的code去获取openid，openid就是鉴定用户身份的
+ 通过合法的code拿到openid后，判断当前数据库中是否已经存在这个用户的相关数据，若存在，直接下一步，若不存在则创建一个一条记录进去（用户只要登录过就会有记录）
+ 在用户是通过小程序登录的时候调用下面这个函数（实现上面的业务逻辑）
+ 这里实际上就是将逻辑和api分开了，不是直接将业务逻辑放到api中，而是重新定义一个类 将函数放到里面去处理相关的业务

```javascript
class WXManager {
  static async codeToToken (code) {
    const loginUrl = util.format(global.config.wx.url, global.config.wx.appId, global.config.wx.appSecret, code)
    const result = await axios.get(loginUrl)
    if (result.data.status !== 200) {
      throw new global.errs.AuthFailed('openid获取失败')
    }
    if (result.data.errcode !== 0) {
      throw new global.errs.AuthFailed('openid获取失败' + result.errcode)
    }
    const openid = result.data.openid
    //  ，也是有利于代码分层1	
    const user = await User.getUserByOpenid(openid)
    if (!user) {
      await User.registerByOpenid(openid)
    }
  }
}
```

### 用来测试接口的微信小程序

+ 后端在编写好一些api接口之后会需要对接口进行测试，这时候就需要用到微信小程序来发送一些http请求了，由于需要测试的按钮非常多，而关键在于测试api而不是样式，所以引入小程序组件库来创建这些接口，里面已经实现好了很多不同的按钮或者菜单等基本组件的样式，直接调用就好了。

  + 现在的小程序已经能比较好的使用npm了，创建好项目之后，在根目录下输入`npm init`，再在小程序设置中打开`使用npm模块`，加载lin-ui（此次要使用的组件库）`npm i lin-ui`，导入好包之后点击微信开发者工具中的 工具-构建npm，这时会出现miniprogram_npm文件夹，里面有lin-ui中编译好的所有组件；

  + 在小程序页面中添加按钮，再给按钮添加点击事件来发送http请求（注意要打开后端服务器）
  + 前后端联调就做到了

#### 下面就简单说一下各接口的测试方法

1. 获取openid（用户通过小程序登录时的凭证）
   + 使用wx.login()函数，里面有回调函数success来获取到res.code，利用获取到的code来发送http请求：用wx.request()函数，传入参数是url（本地服务器地址，注意若是调试的时候填写的本地服务器地址，要在开发工具中设置好不设置https校验） 方法（POST） 以及Data
   + 获取到的数据可以拿到openid了
2. 测试token是否有效
   + 在/app/api/v1/token.js文件中，多写一个测试的中间件函数，用于给前端发送测试token的请求用的
   + 在validator.js中加一个NotEmptyValidator来校验token是否为空
   + 在/middlewares/auth.js（专门用来写验证权限的东西的），给Auth类加一个verifyToken方法，利用上面的jwt（JsonWebToken）的verify函数来看当前传入的token是否合法，简单的返回true/false
   + 在第一步的中间件函数调用verifyToken方法，将结果返回给客户端

### basic-auth

在HTTP中，基本认证（Basic access authentication）是一种用来允许网页浏览器或其他客户端程序在请求时提供用户名和口令形式的身份凭证的一种登录验证方式。

#### 原理

这一个典型的HTTP客户端和HTTP服务器的对话，服务器安装在同一台计算机上（localhost），包含以下步骤：

- 客户端请求一个需要身份认证的页面，但是没有提供用户名和口令。这通常是用户在地址栏输入一个URL，或是打开了一个指向该页面的链接。
- 服务端响应一个401应答码，并提供一个认证域。
- 接到应答后，客户端显示该认证域（通常是所访问的计算机或系统的描述）给用户并提示输入用户名和口令。此时用户可以选择确定或取消。
- 用户输入了用户名和口令后，客户端软件会在原先的请求上增加认证消息头，然后重新发送再次尝试。
   其名称与值的形式是这样的(放到请求header里)

```javascript
Authorization: Basic base64encode(username+":"+password)
```

- 在本例中，服务器接受了该认证屏幕并返回了页面。如果用户凭据非法或无效，服务器可能再次返回401应答码，客户端可以再次提示用户输入口令。

**注意:**客户端有可能不需要用户交互，在第一次请求中就发送认证消息头。

#### 使用方法

1、postman：

+ 点击Authorization
+ type选择Basic Authentic
+ 在username和password输入信息（登录时需要密码的情况 如小程序的邮箱登录）
+ 或者仅在username处输入token令牌（登陆时不需要密码的情况 如小程序的直接从微信点击进入）

2、小程序发送请求时直接携带token令牌（账号密码也一样）：

+ 发送请求的header里带上Authorization，**注意要使用base64加密**
+ 引入base64的npm包来进行
+ 当然还是要注意上面的格式：`Authorization: Basic base64encode(username+":"+password)`

```javascript
wx.request({
      url: 'http://localhost:3000/v1/classic/latest',
      method: "GET",
      header: {
        Authorization: this._encode()
      },
      success: (res) => {
        console.log(res.data)
      }
    })
    
_encode() {
    const token = wx.getStorageSync('token')
    return 'Basic ' + Base64.encode(token + ':')
  }
```

