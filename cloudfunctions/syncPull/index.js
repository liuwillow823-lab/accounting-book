/**
 * 账单同步拉取云函数
 * 拉取该用户云端全部账单（包含已删除标记的软删除记录）
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: -1, message: '获取用户身份失败' }

  const coll = db.collection('transactions')
  const res = await coll.where({ ownerId: OPENID }).limit(1000).get()

  const transactions = res.data.map(d => Object.assign({ id: d._id }, d))
  return { code: 0, transactions }
}