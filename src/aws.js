const CONF = require('../config')
const AWS = require('aws-sdk')
const serializeError = require('serialize-error')
const noti = require('./notify')
const _ = require('lodash')
// TODO: AuthorizeSecurityGroupIngress 添加一条入口规则
// TODO: RevokeSecurityGroupIngress 删除一条入口规则

AWS.config.setPromisesDependency(require('bluebird'))

module.exports = async (ip, oldIp) => {
  try {
    for (let i = 0; i < CONF.AWS.length; i++) {
      const aws = CONF.AWS[i]
      const credentials = new AWS.SharedIniFileCredentials({ profile: aws.profile })
      AWS.config.credentials = credentials
      AWS.config.update({ region: aws.region })
      const ec2 = new AWS.EC2()
      const data = await ec2.describeSecurityGroups({ GroupIds: aws.groupIds }).promise()
      for (let j=0; j< data.SecurityGroups.length; j++){
        const securityGroup = data.SecurityGroups[j]
        const _ipPermissions = []
        _.each(securityGroup.IpPermissions, (ipPermission) => {
          const _ipRanges = _.filter(ipPermission.IpRanges, function (ipRange) {
            return ipRange.CidrIp === oldIp + '/32' ||
              (typeof ipRange.Description === 'string' && ipRange.Description.toLowerCase().includes('local'))
          })
          if (!_.isEmpty(_ipRanges)) {
            _ipPermissions.push({
              IpProtocol: ipPermission.IpProtocol,
              FromPort: ipPermission.FromPort,
              ToPort: ipPermission.ToPort,
              IpRanges: _ipRanges
            })
          }
        })
        if (!_.isEmpty(_ipPermissions)) {
          await ec2.revokeSecurityGroupIngress({
            GroupName: securityGroup.GroupName,
            IpPermissions: _ipPermissions
          }).promise()
          await ec2.authorizeSecurityGroupIngress({
            GroupName: securityGroup.GroupName,
            IpPermissions: _.map(_ipPermissions, (_ipPermission) => {
              _ipPermission.IpRanges = [{
                CidrIp: ip + '/32',
                Description: 'local'
              }]
              return _ipPermission
            })
          }).promise()
        }
      }
      // await _.each(data.SecurityGroups, async (securityGroup) => {
      //
      // })
    }
    return true
  } catch (err) {
    noti('更新AWS规则失败', serializeError(err), false)
    return false
  }
}