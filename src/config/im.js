const config = {
  // 资源路径根目录，为了方便用户部署在二级以上URL路径上
  resourceUrl: 'http://yx-web.nos.netease.com/webdoc/h5',
  // 默认用户头像
  defaultUserIcon: require('@/assets/img/default-icon.png'),
  // 默认普通群头像
  defaultGroupIcon: require('@/assets/img/default-icon.png'),
  // 默认高级群头像
  defaultAdvancedIcon: require('@/assets/img/default-advanced.png'),
  // 系统通知图标
  noticeIcon: require('@/assets/img/notice-icon.png'),
  // 我的手机图标
  myPhoneIcon: require('@/assets/img/my-phone.png'),
  // 本地消息显示数量，会影响性能
  localMsgLimit: 30,
  // 消息之前间隔多长时间增加一个时间tag
  timeTagElapsed: 1000 * 60 * 5,
  // 是否开启订阅服务
  openSubscription: false,
  // 是否使用本地db
  useDb: true
}

const env = 'online'

const appConfig = {
  // 用户的appkey
  // 用于在web demo中注册账号异步请求demo 服务器中使用
  test: {
    appkey: 'fe416640c8e8a72734219e1847ad2547'
  },
  online: {
    appkey: '9afc3cc6744048fba2248ff01dc9ee65'
  }
}

export default { ...config, ...appConfig[env] }
