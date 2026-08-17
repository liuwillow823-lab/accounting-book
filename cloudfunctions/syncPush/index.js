/**
 * 账单同步上传云函数
 * 把小程序的待同步账单写入云端，以本地产物 id 作为文档 id，避免重复
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const coll = db.collection('transactions')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: -1, message: '获取用户身份失败' }

  const transactions = (event.transactions || []).filter(t => t && t.id)
  if (!transactions.length) return { code: 0, pushed: 0 }

  const tasks = transactions.map(t => {
    const data = Object.assign({}, t, { ownerId: OPENID })
    delete data._id
    return coll.doc(t.id).set({ data })
  })

  await Promise.all(tasks)
  return { code: 0, pushed: transactions.length }
}