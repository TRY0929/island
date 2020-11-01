# 旧岛后端API编写以及前端测试接口编写

## api编写整体框架（一定要注意整个过程都是同步的）

+ **数据库**：每个操作要有对应的数据库，也就是前端发来的请求是要从哪张表中获取信息，在models文件夹下要写好相应的数据表操作文件（一个文件操作一张表）
+ **token校验**：用koa-router插件写好相应的请求格式后，在处理的中间件函数之前要调用校验token的函数（专门写在了middlewares/auth.js中）
  + 若校验没通过就不返回任何数据，且抛出错误
  + 若校验通过，将当前从token中获取的uid和scope信息放到ctx上下文中，后续中间件函数操作的时候方便拿到
+ **参数校验**：用 linValidator 作为主框架来校验输入的参数，每次在 app/validators/validator.js 中写一个新的类来校验参数，校验完毕成功的结果是个对象，可以用它来获取输入的参数数据
+ **获取数据**：调用相应数据库的操控文件中写的函数来获取需要的数据
  + 为什么不直接在api中写呢？原因之前也说过啦，逻辑都是写在model层里的，这样有利于代码分层，况且本身数据库操控函数就是来操控数据库的，不用它来操控干啥
+ **返回数据**：这里的几乎所有数据都是直接返回在请求体里，也就是ctx.body=返回数据

## 用来测试接口的微信小程序

+ 后端在编写好一些api接口之后会需要对接口进行测试，这时候就需要用到微信小程序来发送一些http请求了，由于需要测试的按钮非常多，而关键在于测试api而不是样式，所以引入小程序组件库来创建这些接口，里面已经实现好了很多不同的按钮或者菜单等基本组件的样式，直接调用就好了。

  + 现在的小程序已经能比较好的使用npm了，创建好项目之后，在根目录下输入`npm init`，再在小程序设置中打开`使用npm模块`，加载lin-ui（此次要使用的组件库）`npm i lin-ui`，导入好包之后点击微信开发者工具中的 工具-构建npm，这时会出现miniprogram_npm文件夹，里面有lin-ui中编译好的所有组件；
  + 在小程序页面中添加按钮，再给按钮添加点击事件来发送http请求（注意要打开后端服务器）
  + 前后端联调就做到了
+ 一般来说wx.request()里有如下参数
  + url：本地的服务器地址；
  + method：一般也就GET和POST，看情况而定；
  + header：可以来传参，这里的header就是用来传递进行基本验证（下面有详细说明）；
  + body：有时候请求数据会放到请求体里。

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

**注意:** 客户端有可能不需要用户交互，在第一次请求中就发送认证消息头。

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

## 小程序（/v1/token）

### 数据库

+ 这部分其实就是登录部分，也就是要记录或合适登录用户的信息，所以创建的数据表是User表
+ 数据：type（登录方式）、nickname（用户昵称）、email、password、openid（）

+ 在models下创建user.js文件专门来控制user表的数据

### 参数校验

+ 登录接口需要对这些输入数据都进行校验，但最重要的还是type，但上面说过了，不多说；

### 接口实现

#### 登录（/）

+ 用switch...case语句通过当前type（登录方式）的不同来选择不同的处理函数，成功的话最后都要返回给用户token值：

+ **若是Email登录**，则肯定输入了账号和密码，调用emailLogin函数（这个函数还是在登录api文件里，但为了代码简洁性 写个函数放在外面处理）；

  + emailLogin函数中调用User的verifyEmailPassword函数，将账号密码传进去，思路很简单，也就是通过账号先查出对应的密码，再比对和输入的密码是否一致即可，但要注意**密码千万不能明文保存在数据库里**，因此也就多了个解码再比对（都通过bcrypt实现）的过程；
  + 如果比对发现密码正确，则通过generateToken函数来给该用户颁发一个token值，以后只要在请求里携带该token值就不用输入密码了（注意携带的方式，不是直接放在请求body里哦，详情见另一篇JsonWebToken博文），通常前端会将token保存在浏览器缓存里，之后直接在缓存里取就好了（后续请求都要携带token）；

+ **若是小程序登录**，这样用户不需要输入密码，因为不需要校验了 肯定是合法的，调用WXManager中的codeToToken方法（在services/wx.js中），为什么要专门写个类来操作呢，我觉得应该是这部分涉及到了微信的官方获取openid的操作，而且还有用户的信息等？

  + 这种情况下通过微信官方的方式获取用户的openid（具体可见微信文档，其实就是通过axios发送个请求到一个特定的网址 同时在路径里携带好官方凭证）；

  + 获取到openid后，去user表里查询看该openid是否有相应的数据条目，没有就创建一条；
  + 最后用用户的id和scope来生成token返回回去。

##### 前端接口

```javascript
onGetToken () {
  // 通过微信官方提供的登录能力方便地获取微信提供的用户身份标识
  wx.login({
    // 调用login函数 在这里面去请求token什么的
    success: (res) => {
      if (res.code) {
        wx.request({
          url: 'http://localhost:3000/v1/token',
          method: 'POST', // 默认是GET 注意这里是POST
          data: {
            account: res.code,
            type: 100
          },
          success: (res) => {
            const status = res.statusCode.toString()
            if (status.startsWith('2')) {
              wx.setStorageSync('token', res.data)
            }
          }
        })
      }
    }
  })
},
```

#### 验证（/verify）

+ 作用很简单，其实就是来给程序员进行调试的接口，将保存的token放到请求body里来发送请求；
+ 调用Auth类的verifyToken函数（在middlewares/auth.js中），verifyToken中又用jsonwebtoken中自带的verify函数来进行校验，返回结果即可；
  + 这里为什么不直接在api中调用jwt的verify函数，答案还是为了代码分层，在api接口里最好不要直接写太多逻辑，而是将逻辑都放在相应专门处理的地方，比如这里就涉及到token的校验，之前就写过一个Auth类专门用来校验token，所以放在那里刚好合适；

##### 前端接口

```javascript
onVerifyToken () {
	wx.request({
		url: 'http://localhost:3000/v1/token/verify',
		method: 'POST',
		data: {
      // 检验缓存里的token是否合法
			token: wx.getStorageSync('token')
		},
		success: (res) => {
			console.log(res.data)
		}
	})
}
```

## 点赞（/v1/like）

### 数据库

+ 点赞信息专门由一个favor表来放，每点赞一下就多一条记录，取消点赞就删除记录；
+ 数据：uid（用户编号）、art_id（点赞对象编号）、type（点赞对象类型）；
+ 在models下创建favor.js文件专门来控制favor表的数据。

### token校验

这个大家都一样，就不说了

### 参数校验

+ 点赞接口中需要对两个参数进行校验，art_id和type；
+ 在api/validators/validator.js中，写一个LikeValidator类 继承于 PositiveIntegerValidator，id的话就直接在 PositiveIntegerValidator 中可以检验了，type的检验有点麻烦，写个类 里面写上各种合理的type值，类中写个实例方法来判断输入的type值是否合法；
+ 但注意 实际上这个type不止有点赞对象类型（是书籍 句子还是期刊）这一层意思，还可以是一会儿的登录状态（看是从哪登录的），因此可以定义两个对象分别放着不同的数据，到时候要调用判断函数的时候，直接通过对象调用，就能校验不同的type了。

### 获取数据

+ 调用Favor类中的like函数；
+ like函数中思路也很简单，先看在当前表中查找findOne是否由一模一样的点赞记录，若有就抛出一个 “您已经点过赞” 的异常，若没有，就将这一条点赞信息插入create进表里；
+ 点赞的时候要注意, 不仅这条记录要create到favor表里, 还要将对应的作品的fav_nums加一, 且这一系列操作一定要是一起完成的, 所以要用到数据库的transaction操作, 也就是如果其中某一个步骤由于某种原因没有完成, 那么其余完成的所有步骤也会恢复原状, 保证了数据的一致性。

### 返回数据

+ 这里不需要返回数据，就结束指回在api里抛出一个“成功的异常”；

like/cacel和like思路几乎一模一样，这里就不重复赘述。

#### 前端接口

+ 接下来就不贴所有的前端接口的代码了，大体都和这个差不多；
+ 注意传参的位置，以及Authoration一定要放在header里哦，还要进行base64加密。

```javascript
onLike () {
	wx.request({
		url: 'http://localhost:3000/v1/like',
		method: 'POST',
		header: {
			Authorization: this._encode()
		},
		data: {
			art_id: 1,
			type: 100
		},
		success: res => {
			console.log(res.data)
		}
	})
},
```

## 期刊（/v1/classic）

### 数据库

+ 期刊信息专门由一个flow表来放，但这里面没有放期刊的全部信息，具体内容根据不同的type在各个表里放着
+ 数据：status（喜不喜欢）、index（期刊序号）、type（期刊类型）、art_id（编号 用这个和type可唯一确定一个东西）
+ 在models下创建flow.js文件专门来控制flow表的数据

### 接口实现

#### 说明

+ 这里要说一下, flow这个表里放的只是区分不同期刊的信息, 而并没有每个期刊里面内容的详细信息, 所以若要获取内容信息 必须去相应的表中根据type和art_id来获取
+ 每次要获取的时候都要判断类型是不是很麻烦呢? 所以还是将这个过程封装成一个Art类, 里面有函数专门用来处理这种情况
+ Art类中的getData函数就是来获取不同表中信息的方法, 里面通过switch...case来根据type的不同 去不同的表里查找信息并返回
+ Art类放在api/models/art.js中, 虽然在这个文件夹下, 而且也是在操作数据库, 但是art并没有对应实际的物理表, 而只是为了获取数据写出来的一个类, 因此也不需要继承Sequelize什么的.
+ 有了Art类之后, 每次获取期刊的信息都是以下步骤
  + 用户发送请求, 带上期刊序号
  + Flow中接收期刊index, 通过index在flow表里查找当前期刊相应的type和art_id
  + 根据刚刚查找到的两个数据, 调用Art里的getData方法, 在不同的表里找到对应要找到的数据信息并返回

#### 获取最新一期(/latest)

+ 不需要传参数,直接调用Flow的getLatest函数;
+ getLatest函数里, 由于是要获取最新一期, 也就是index最大的一期, 但由于期刊数目可能会变 不太方便直接把数字写死, 因此利用sequelize的findOne的order方法将index按照降序排序, 再获取第一个即可, 再像说明里的获取详细信息
+ 像这种数据库的搜索方法, 都到sequelize官网去看一下即可, 很多

#### 获取上/下/某一期(/:index/next  /:index/prev  /:type/:id)

+ 参数校验检验index, 这里可以还是用PositiveIntegerValidator来检验, 但里面写的要检验的参数的id, 我们可以手动在validate函数里加上第二个参数, {id: 'index'}, 来给里面要检测的东西换个名字
+ 直接在查询的时候index+1或者-1就可以控制上/下一期了
+ 某一期的话直接把type和id传到art里获取那一期的信息即可

#### 获取某期点赞信息(/:type/:id/favor)

+ 参数校验需要校验type和id, 这里直接用LikeValidator

+ 调用flow里写好的getFavor函数

  + 把当前uid和type id一起传进去, uid通过ctx.auth.uid得到, 这就是在token校验的时候把uid和scope放到ctx上下文中的好处, 可以随时在中间件中拿到

  + 这里的数据又是在一张表里查不完的数据, 需要返回fav_nums id like_status三个数据, 其中flow表中只有id这一个数据, 另外fav_nums要去具体type对应的表中找, 而like_status要去favor中看有没有这一期刊对应的信息, 所以涉及到了三张表
  + 大概思想就是按照上面这样去查找

#### 获取我喜欢的期刊(/favor)

+ 不需要传参数, 直接调用Favor的getUserLike函数, 这个函数里找到favor表中所有当前用户(通过uid号)点赞过的期刊, 当然**获取单单favor表中的信息是不够的, 还要有详细信息**
+ 如果是对获取的favor表中当前所有点赞条目进行遍历, 依次找到对应的详细信息也是可以的, 且代码量也少, 但是**一遍一遍查询数据库太耗费资源了**, 且多次查询数据库可能会引起和其他程序并发查询的问题
  + 因此有什么方法可以一次查询出所有需要的数据呢? 其实可以想到, **最少最少都需要三次查询, 因为有三张表**嘛(music sentence movie)
  + 在art里写一个getList方法专门用来实现上面的功能(当然里面还调用了一个_getListType方法), 直接贴代码吧, 思想在注释里

```javascript
// artInfoList是从favor表里查询出来的所有数据的数组
static async getList (artInfoList) {
  const arts = {
    100: [],
    200: [],
    300: []
  }
  for (let artInfo of artInfoList) {
    // 将不同type的id放到相应arts对象下的数组里
    arts[artInfo.type].push(artInfo.art_id)
  }
  let res = []
  for (let key in arts) {
    if (key.length === 0) {
      continue
    }
    // 遍历三种type, 分别调用下面这个函数
    res.push(await this._getListType(arts[key], parseInt(key)))
  }
  // 最后返回的是个一维数组, 打瘪一下
  res = flatten(res)
  return res
}

static async _getListType (ids, key) {
  // 在type是key的表里进行查找, 如100就在movie里查找
  let res
  const finder = {
    // 这里利用了sequelize库查找里的[Op.in]方法, 只要id在ids数组里有就放入结果里返回
    where: {
      id: ids
    }
  }
  // 根据key不同查找出这些id对应的结果
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
```

## 书籍（/v1/book）

### 数据库

+ 书籍信息的话, 并不是将全部好多万本书的信息都放在自己的数据库里, 实际上是放在另外的服务器上, 这里的koa实际上是起到了中间层的作用: 
  + 本来web领域分为客户端于服务端, 但现在多出了一个中间层的概念，就是在后端这里再抽离一层出来，在业务上处理和客户端衔接更紧密的部分，比如页面渲染（SSR），数据聚合，接口转发等等。
+ 因此在我们自己数据库上实际上只有热门书籍的一些部分信息, 真正更多的信息要去更大的服务器上找
+ 在models下创建hot_book.js文件专门来控制hot_book表的数据
+ 数据: status（是否点赞）、id（书的art_id）、image（书封面地址）、author（作者）、title（书名）
+ 注意这里虽然是用hot_book表把热门书籍一些信息存在数据表里了，但操作基本都是在/api/models/book.js文件里（这里面没有对应的真正的物理表）

### 接口实现

#### 获取热门书籍(/hot_list)

+ 不需要进行参数校验，且其实这里大部分内容都已经在hot_list表里了，只剩下一个fav_nums不在
  + 要拿到fav_nums怎么拿？之前拿movie、sentence或music的fav_nums的时候都是直接去相应的表里拿，但现在书籍的实际详情信息其实并不在我们自己的数据库上；
  + 因此要拿到书籍的点赞数量其实很简单，就去favor表里查找有多少条关于这本书的点赞信息再返回即可；
  + 想一想，每本书都要去favor表里查找一次，这样的不确定次数的查找是非常影响数据库性能的，因此还是想到要用sequelize的Op.in方法将所有的书籍id都放到一个数组里，只要有里面的书就给相应的数量加一，说起来简单做起来难
  + 这里又要用到sequelize里的方法了，详细情况看官方文档，这里只演示怎么用；
  + 下面这样查找完了之后，返回的favors里每个对象都会多上一个count属性，里面记录了where条件里查找的数据根据art_id分好类之后，每个类里有多少条数据，也就是favor表中每本图书被点赞的次数了。

```javascript
const favors = await Favor.findAll({
	where: {
		art_id: {
			[Op.in]: ids
		},
		type: 400
	},
	group: ['art_id'],
	attributes: ['art_id', [Sequelize.fn('COUNT', '*'), 'count']]
})
```

+ 当然这样还不够，还要再遍历books数组（hot_list表中所有书籍），找到每本书在favors里对应的记录，如果有的话就把对应的count属性也放到book上，没有就设置book的count属性为0。

```javascript
static async getAll () {
  // 获取HotBook数据表中所有图书
	const books = await HotBook.findAll()
	const ids = []
  // 将图书id放到一个数组里，方便后续查找
	books.forEach(item => {
		ids.push(item.id)
	})
	const favors = await Favor.findAll({
		where: {
			art_id: {
				[Op.in]: ids
			},
			type: 400
		},
    // 根据art_id分好组
		group: ['art_id'],
    // 计算每个不同的art_id组里有多少条记录，并且用一个count属性存下来
		attributes: ['art_id', [Sequelize.fn('COUNT', '*'), 'count']]
	})
	books.forEach(book => {
    // 遍历books里每本书，在刚刚的favors里查找有没有对应一样id的书，有的话就把count拿过来赋值
		book.setDataValue('count', HotBook._getBookStatus(book, favors))
	})
	return books
}

static _getBookStatus (book, favors) {
	const fs = favors.filter(favor => book.id === favor.art_id)
	if (fs.length === 0) {
		return 0
	}
	return parseInt(fs[0].get('count'))
}
```

#### 获取书籍详细信息（/:id/detail）、书籍搜索（/search）

+ 这两个都是要访问远程服务器来请求得到信息的，远程服务器网址写在配置文件里，这样改也方便，结合要查询的参数 用axios发送请求即可；

#### 获取喜欢书籍数量（/favor/count）

+ 不用校验参数，直接调用book的getMyFavorBookCount方法，将当前用户uid传进去（通过ctx.auth.uid得到，这是在token校勘的时候放到上下文的）；
+ 在getMyFavorBookCount中直接查找Favor表里的关于书本的当前uid喜欢的记录再返回即可。

## 短评（其实这个也是在book部分的，不过它又重新操控了一个数据表，所以就又写个大标题吧= =）

### 数据库

+ 短评信息专门由一个comment表来放，每多一条短评就多一条记录，同时还可以记录当前内容的短评被发表的次数；
+ 数据：content（短评内容）、num（一样内容的短评被发表的次数）、book_id（是对哪本书发表的短评）；
+ 在models下创建comment.js文件专门来控制comment表的数据。

### 参数校验

+ 短评接口需要对content进行校验；
+ 在api/validators/validator.js中，写一个CommentValidator类 继承于 LinValidator，添加rule即可。

### 接口实现

#### 添加短评（/add/comment）

+ 要添加的书籍id以及短评内容都放到请求体里，参数校验完毕后调用comment的addComment函数；
+ addComment先搜索一遍comment表里的数据，看是否有书籍id和comment内容都一样的记录（也就是同一本书下有没有一样的短评）：
  + 有的话，直接在那条记录基础上数量加个一；
  + 没有的话添加一条新纪录。

#### 获取短评（/:book_id/short_comment）

+ 还是用PositiveIntegerValidator来校验book_id，注意给id换个名字；
+ 调用comment的getComment方法，将当前book_id都传进去来获取对应书籍的短评，里面内容就不多说了，就是查找。

