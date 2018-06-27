# securitygroups-ipv4-sync
Automates sync your local IP with your cloud services, supports

  * AWS
  * ALICLOUD (阿里云）
  * TENCENTCLOUD (腾讯云）
  
for current version

# Clone

# CONFIG

```
{
  "TITLE": "autoSecureGroupsUpdater 1.0", // title displayed in notification
  "CRONTIME": "*/15 * * * *", // cron time
  "QUIET": true,  // whether show a success notification
  "AWS": [    // you can add multiple accounts with multiple security groups
  	// FOR AWS, you should download the 
    {
      "profile": "$yourname",   // account
      "region": "$region",  // region-id
      "groupIds": [	
        "$groupId1",    // security-group id
        "$groupId2"
      ]
    }
  ],
  "ALICLOUD": [
    {
      "accessKeyId": "$accessKeyId",
      "accessKey": "$accessKey",
      "endpoint": "https://ecs.aliyuncs.com",
      "apiVersion": "2014-05-26",
      "regionId": "$region",
      "securityGroupIds": [
        "$groupId1"
      ]
    }
  ],
  "TENCENTCLOUD": [
    {
      "secretId": "$secretId",
      "secretKey": "$secretKey",
      "regionId": "$regionId",
      "apiVersion": "2017-03-12",
      "securityGroupIds": [
        "$groupId1"
      ]
    }
  ]
}

```

# RUN

I simply use PM2, as reference
