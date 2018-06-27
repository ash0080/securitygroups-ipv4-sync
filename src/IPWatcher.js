const { promisify } = require('util')
const noti = require('./notify')
const getIP = promisify(require('external-ip')({
  replace: true,
  services: [
    'http://icanhazip.com/',
    'http://myip.dnsomatic.com/',
    'http://ipecho.net/plain',
    'http://diagnostic.opendns.com/myip'
  ],
  timeout: 600,
  getIP: 'parallel'
  // verbose: true
})) // <-- And then wrap the library

module.exports = async () => {
  try {
    const myIp = await getIP()
    if (myIp) return myIp
  } catch (error) {
    noti('IP自动更新服务', '未能获取外网IP', false)
  }
}