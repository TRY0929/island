const {Sequelize, Model} = require('sequelize')
const {
  dbName,
  host,
  port,
  user,
  password
} = require('../config/config').database
const {
  unset,
  isArray,
  clone
} = require('lodash')

const sequelize = new Sequelize(dbName, user, password, {
  dialect: 'mysql',
  host,
  port,
  logging: console.log,
  timezone: '+08:00',
  define: {
    timestamps: false,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    underscored: true,
    freezeTableName: true,
    scopes: {
      bh: {
        attributes: {
          exclude: ['created_at', 'updated_at', 'deleted_at']
        }
      }
    }
  }
})

Model.prototype.toJSON  = function () {
  let data = clone(this.dataValues)

  for (key in data) {
    if (key === 'image') {
      if (!data[key].startsWith('http')) {
        data[key] = global.config.host + data[key]
      }
    }
  }

  if (isArray(this.exclude)) {
    this.exclude.forEach(item => {
      unset(data, item)
    })
  }
  return data
}

sequelize.sync({force: false})

module.exports = {
  sequelize
}