/**
 * 登录云函数
 * 通过微信云开发环境自动注入的身份上下文获取 openid
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async () => {
  const { OPENID, APPID } = cloud.getWXContext()
  if (!OPENID) {
    return { code: -1, message: '获取用户身份失败' }
  }
  return {
    code: 0,
    openid: OPENID,
    appid: APPID
  }
}