module.exports = {
  // prod
  environment: 'dev',
  database: {
    dbName: 'island',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'TTTtry123456'
  },
  security: {
    secretKey: 'abcdefg',
    expiresIn: 60*60*24*30
  },
  wx: {
    appId: 'wx6d8dee6178135e8a',
    appSecret: '28c5fd80316662b796ed88ce337a7bbe',
    url: 'https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code'
  },
  yushu: {
    detailUrl: 'http://t.talelin.com/v2/book/id/%s',
    keywordUrl: 'http://t.talelin.com/v2/book/search?q=%s&count=%s&start=%s&summary=%s'
  },
  host: 'http://localhost:3000/'
}