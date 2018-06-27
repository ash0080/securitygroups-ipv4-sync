const CONF = require('../config')
const tencentcloud = require('tencentcloud-sdk-nodejs')
const serializeError = require('serialize-error')
const noti = require('./notify')
const _ = require('lodash')

// TODO: CreateSecurityGroupPolicies 添加规则
// TODO: DeleteSecurityGroupPolicies 删除规则
// TODO: DescribeSecurityGroupPolicies 查询安全组规则

function toPromise (fn, client, req) {
  return new Promise((resolve, reject) => {
    client[fn](req, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

const promiseClient = {
  DescribeSecurityGroupPolicies (client, req) {
    return toPromise(arguments.callee.name, client, req)
  },
  DeleteSecurityGroupPolicies (client, req) {
    return toPromise(arguments.callee.name, client, req)
  },
  CreateSecurityGroupPolicies (client, req) {
    return toPromise(arguments.callee.name, client, req)
  }
}

module.exports = async (ip, oldIp) => {
  const VpcClient = tencentcloud.vpc.v20170312.Client
  const models = tencentcloud.vpc.v20170312.Models
  const Credential = tencentcloud.common.Credential
  try {
    for (let i = 0; i < CONF.TENCENTCLOUD.length; i++) {
      const tCloudConf = CONF.TENCENTCLOUD[i]
      const cred = new Credential(tCloudConf.secretId, tCloudConf.secretKey)
      const client = new VpcClient(cred, tCloudConf.regionId)
      for (let j = 0; j < tCloudConf.securityGroupIds.length; j++) {
        const securityGroupId = tCloudConf.securityGroupIds[j]
        let req = new models.DescribeSecurityGroupPoliciesRequest()
        req.SecurityGroupId = securityGroupId
        // const describeSecurityGroupPolicies = Promise.promisifyAll(client.DescribeSecurityGroupPolicies)
        const res = await promiseClient.DescribeSecurityGroupPolicies(client, req)
        const _ingress = []
        _.each(res.SecurityGroupPolicySet.Ingress, rule => {
          if (rule.CidrBlock === oldIp + '/32' ||
            (typeof rule.PolicyDescription === 'string' && rule.PolicyDescription.toLowerCase().includes('local'))) {
            _ingress.push(_.pick(rule, [
              'Protocol',
              'Port',
              'CidrBlock',
              'Action',
              'PolicyDescription'
            ]))
          }
        })
        if (!_.isEmpty(_ingress)) {
          let req = new models.DeleteSecurityGroupPoliciesRequest()
          req.SecurityGroupId = securityGroupId
          req.SecurityGroupPolicySet = {
            Ingress: _ingress
          }
          await promiseClient.DeleteSecurityGroupPolicies(client, req)
          req = new models.CreateSecurityGroupPoliciesRequest()
          req.SecurityGroupId = securityGroupId
          req.SecurityGroupPolicySet = {
            Ingress: _.map(_ingress, rule => {
              rule.CidrBlock = ip + '/32'
              rule.PolicyDescription = 'local'
              return _.pick(rule, [
                'Protocol',
                'Port',
                'CidrBlock',
                'Action',
                'PolicyDescription'
              ])
            })
          }
          await promiseClient.CreateSecurityGroupPolicies(client, req)
        }
      }
    }
    return true
  } catch (err) {
    noti('更新TENCENTCLOUD规则失败', serializeError(err), false)
    return false
  }
}