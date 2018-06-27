const NotificationCenter = require('node-notifier').NotificationCenter
const path = require('path')
const CONF = require('../config')
const nc = new NotificationCenter()

module.exports = (subtitle, message, success) => {
  nc.notify({
    title: CONF.TITLE,
    subtitle,
    message,
    icon: void 0,
    contentImage: path.join(__dirname, '../asset/wall.png'),
    sound: success?'Glass':'Basso',
    wait: false
  })
}
