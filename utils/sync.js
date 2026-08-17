/**
 * 云同步工具（本地优先，后端合并）
 * - 未登录：不触发任何同步，保持纯本地
 * - 登录后：推送待同步数据 + 拉取合并云端数据
 * - 老数据迁移：本地无 syncStatus 的记录会被当作待同步数据，登录后自动上传
 */
const storage = require('./storage')
const { STORAGE_KEYS } = require('./constants')

let pushTimer = null

function getLoginInfo() {
  return storage.get('loginInfo', null)
}

function pickServerFields(t) {
  return {
    id: t.id,
    type: t.type,
    amount: t.amount,
    date: t.date,
    categoryId: t.categoryId,
    subCategoryId: t.subCategoryId || '',
    categoryName: t.categoryName || '',
    subCategoryName: t.subCategoryName || '',
    categoryIcon: t.categoryIcon || '',
    remark: t.remark || '',
    createdAt: t.createdAt || 0,
    updatedAt: t.updatedAt || 0,
    deleted: !!t.deleted
  }
}

function normalizeRemote(r) {
  return {
    syncStatus: 'synced',
    id: r.id,
    type: r.type === 'income' ? 'income' : 'expense',
    amount: Number(r.amount) || 0,
    date: r.date,
    categoryId: r.categoryId,
    subCategoryId: r.subCategoryId || '',
    categoryName: r.categoryName || '',
    subCategoryName: r.subCategoryName || '',
    categoryIcon: r.categoryIcon || '',
    remark: r.remark || '',
    createdAt: r.createdAt || 0,
    updatedAt: r.updatedAt || 0,
    deleted: !!r.deleted
  }
}

/** 本地待同步记录（未标记已同步的，包括软删除记录） */
function getPendingTransactions() {
  const list = storage.get(STORAGE_KEYS.TRANSACTIONS, [])
  return list.filter(t => t && t.id && t.syncStatus !== 'synced')
}

/** 推送本地待同步数据到云端 */
async function pushPending() {
  if (!wx.cloud) return
  const login = getLoginInfo()
  if (!login || !login.openid) return

  const pending = getPendingTransactions()
  if (!pending.length) return

  try {
    await wx.cloud.callFunction({
      name: 'syncPush',
      data: { transactions: pending.map(pickServerFields) }
    })
    const list = storage.get(STORAGE_KEYS.TRANSACTIONS, [])
    const ids = new Set(pending.map(t => t.id))
    list.forEach(t => {
      if (ids.has(t.id)) t.syncStatus = 'synced'
    })
    storage.set(STORAGE_KEYS.TRANSACTIONS, list)
  } catch (err) {
    console.error('[sync.pushPending]', err)
  }
}

/** 拉取云端数据并合并到本地 */
async function pullAndMerge() {
  if (!wx.cloud) return
  const login = getLoginInfo()
  if (!login || !login.openid) return

  try {
    const res = await wx.cloud.callFunction({ name: 'syncPull' })
    const remote = (res && res.result && res.result.transactions) || []
    if (!remote.length) return

    const list = storage.get(STORAGE_KEYS.TRANSACTIONS, [])
    const map = {}
    list.forEach(t => { map[t.id] = t })

    remote.forEach(r => {
      if (!r || !r.id) return
      const local = map[r.id]
      if (!local) {
        map[r.id] = normalizeRemote(r)
      } else if ((r.updatedAt || 0) > (local.updatedAt || 0)) {
        map[r.id] = normalizeRemote(r)
      } else if (local.syncStatus === 'synced') {
        local.syncStatus = 'pending'
      }
    })

    storage.set(STORAGE_KEYS.TRANSACTIONS, Object.values(map))
    await pushPending()
  } catch (err) {
    console.error('[sync.pullAndMerge]', err)
  }
}

/** 完整同步：拉取合并后推送（首次登录会顺便把老数据迁移上云） */
async function syncAll() {
  if (!wx.cloud) return
  const login = getLoginInfo()
  if (!login || !login.openid) return
  await pullAndMerge()
  await pushPending()
}

/** 本地变更后的后台推送（防抖，避免连续记账触发多次调用） */
function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer)
  if (!getLoginInfo()) return
  pushTimer = setTimeout(() => {
    pushTimer = null
    pushPending()
  }, 1000)
}

module.exports = {
  syncAll,
  schedulePush,
  pushPending,
  pullAndMerge
}