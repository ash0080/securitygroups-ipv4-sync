const CONF = require('../config')
const RPCClient = require('@alicloud/pop-core').RPCClient
const serializeError = require('serialize-error')
const noti = require('./notify')
const _ = require('lodash')

// TODO: AuthorizeSecurityGroup 添加一条入口规则
// TODO: RevokeSecurityGroup 删除一条入口规则
// TODO: ModifySecurityGroupRule 修改规则描述

module.exports = async (ip, oldIp) => {
  try {
    for (let i = 0; i < CONF.ALICLOUD.length; i++) {
      const alicloud = CONF.ALICLOUD[i]
      const client = new RPCClient({
        accessKeyId: alicloud.accessKeyId,
        accessKeySecret: alicloud.accessKey,
        endpoint: alicloud.endpoint || 'https//ecs.aliyuncs.com',
        apiVersion: alicloud.apiVersion || '2014-05-26'
      })
      for (let j = 0; j < alicloud.securityGroupIds.length; j++) {
        const SecurityGroupId = alicloud.securityGroupIds[j]
        const SecurityGroup = await client.request('DescribeSecurityGroupAttribute', {
          SecurityGroupId: SecurityGroupId,
          RegionId: alicloud.regionId
        })
        const Permissions = _.get(SecurityGroup, 'Permissions.Permission')
        if (Permissions && Array.isArray(Permissions)) {
          for (let k = 0; k < Permissions.length; k++) {
            const Permission = Permissions[k]
            if (Permission.Direction === 'ingress' &&
              (Permission.SourceCidrIp === oldIp + '/32' ||
                (typeof Permission.Description === 'string' && Permission.Description.toLowerCase().includes('local')))) {
              await client.request('RevokeSecurityGroup', {
                SecurityGroupId: SecurityGroup.SecurityGroupId,
                RegionId: SecurityGroup.RegionId || alicloud.RegionId,
                SourceCidrIp: Permission.SourceCidrIp,
                IpProtocol: Permission.IpProtocol,
                PortRange: Permission.PortRange
              })
              await client.request('AuthorizeSecurityGroup', {
                SecurityGroupId: SecurityGroup.SecurityGroupId,
                RegionId: SecurityGroup.RegionId || alicloud.RegionId,
                SourceCidrIp: ip + '/32',
                IpProtocol: Permission.IpProtocol,
                PortRange: Permission.PortRange
              })
              await client.request('ModifySecurityGroupRule', {
                SecurityGroupId: SecurityGroup.SecurityGroupId,
                RegionId: SecurityGroup.RegionId || alicloud.RegionId,
                SourceCidrIp: ip + '/32',
                IpProtocol: Permission.IpProtocol,
                PortRange: Permission.PortRange,
                NicType: Permission.NicType,
                Description: 'local'
              })
            }
          }
        }
      }
    }
    return true
  } catch (err) {
    noti('更新ALICLOUD规则失败', serializeError(err), false)
    return false
  }
}