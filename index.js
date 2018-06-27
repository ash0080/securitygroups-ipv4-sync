const CronJob = require('cron').CronJob
const CONF = require('./config')
const getMyIp = require('./src/IPWatcher')
const store = require('./src/store')
const updateAli = require('./src/alicloud')
const updateAws = require('./src/aws')
const updateTencent = require('./src/tencentCloud')
const noti = require('./src/notify')


const doUpdate = async () => {
  try {
    const oldIp = store.get('ip') || ''
    const ip = await getMyIp()
    if (ip && ip !== oldIp) {
      const vals = await Promise.all([
        updateAws(ip, oldIp),
        updateAli(ip, oldIp),
        updateTencent(ip, oldIp)
      ])

      for (let i = 0; i < vals.length; i++) {
        if (!vals[i]) {
          noti('更新安全组失败', '操作未能全部执行', false)
          return
        }
      }
      store.set('ip', ip)
      store.save()
      if (!CONF.QUIET) {
        noti('更新安全组失败', '操作未能全部执行', true)
      }
    }
  } catch (err) {
    console.log(err)
  }
}
const cronUpdateIp = new CronJob(CONF.CRONTIME, doUpdate)
cronUpdateIp.start()