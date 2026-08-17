const storage = require('../utils/storage')
const { STORAGE_KEYS } = require('../utils/constants')
const categoryModel = require('./category')
const { today } = require('../utils/date')

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

let onChangeCallback = null

function setOnChange(fn) {
  onChangeCallback = fn
}

function notifyChange() {
  if (typeof onChangeCallback === 'function') {
    onChangeCallback()
  }
}

function inferTypeFromCategory(categoryId) {
  if (categoryModel.findCategory(categoryId, 'income')) return 'income'
  return 'expense'
}

function normalizeTransaction(item) {
  const type = normalizeType(item.type || inferTypeFromCategory(item.categoryId))
  return {
    ...item,
    type,
    subCategoryName: type === 'income' ? '' : (item.subCategoryName || '')
  }
}

function getAllRaw() {
  return storage.get(STORAGE_KEYS.TRANSACTIONS, [])
}

function getAll() {
  return getAllRaw()
    .filter(t => !t.deleted)
    .map(normalizeTransaction)
}

function saveAll(transactions) {
  return storage.set(STORAGE_KEYS.TRANSACTIONS, transactions)
}

function normalizeType(type) {
  return type === 'income' ? 'income' : 'expense'
}

/** 新增一笔账单 */
function add({ amount, date, categoryId, subCategoryId, remark = '', type = 'expense' }) {
  const txnType = normalizeType(type)
  const cat = categoryModel.findCategory(categoryId, txnType)
  const sub = txnType === 'income' ? null : categoryModel.findSubCategory(categoryId, subCategoryId, txnType)
  if (!cat || (txnType === 'expense' && !sub)) {
    throw new Error('分类不存在，请重新选择')
  }

  const now = Date.now()
  const transaction = {
    id: generateId('txn'),
    type: txnType,
    amount,
    date: date || today(),
    categoryId,
    subCategoryId,
    categoryName: cat.name,
    subCategoryName: sub ? sub.name : '',
    categoryIcon: cat.icon,
    remark: remark.trim(),
    createdAt: now,
    updatedAt: now,
    deleted: false,
    syncStatus: 'pending'
  }

  const list = getAllRaw()
  list.unshift(transaction)
  saveAll(list)
  notifyChange()
  return transaction
}

/** 更新账单 */
function update(id, patch) {
  const list = getAllRaw()
  const index = list.findIndex(t => t.id === id)
  if (index === -1) return null

  const item = list[index]
  const type = normalizeType(patch.type || item.type)
  const categoryId = patch.categoryId || item.categoryId
  const subCategoryId = patch.subCategoryId || item.subCategoryId
  const cat = categoryModel.findCategory(categoryId, type)
  const sub = type === 'income' ? null : categoryModel.findSubCategory(categoryId, subCategoryId, type)

  list[index] = {
    ...item,
    ...patch,
    type,
    categoryId,
    subCategoryId,
    categoryName: cat ? cat.name : item.categoryName,
    subCategoryName: type === 'income' ? '' : (sub ? sub.name : item.subCategoryName),
    categoryIcon: cat ? cat.icon : item.categoryIcon,
    remark: patch.remark !== undefined ? patch.remark.trim() : item.remark,
    deleted: false,
    updatedAt: Date.now(),
    syncStatus: 'pending'
  }

  saveAll(list)
  notifyChange()
  return list[index]
}

/** 删除账单（软删除，保留记录以支持云端多端同步删除） */
function remove(id) {
  const list = getAllRaw()
  const index = list.findIndex(t => t.id === id)
  if (index === -1) return true

  list[index] = {
    ...list[index],
    deleted: true,
    updatedAt: Date.now(),
    syncStatus: 'pending'
  }
  saveAll(list)
  notifyChange()
  return true
}

function getById(id) {
  return getAll().find(t => t.id === id) || null
}

function queryByDateRange(startDate, endDate, type) {
  return getAll().filter(t => t.date >= startDate && t.date <= endDate && (!type || t.type === type))
}

function queryByDate(date, type) {
  return getAll().filter(t => t.date === date && (!type || t.type === type))
}

function groupByDate(transactions) {
  const map = {}
  transactions.forEach(t => {
    if (!map[t.date]) {
      map[t.date] = { date: t.date, items: [], total: 0 }
    }
    map[t.date].items.push(t)
    map[t.date].total += t.amount
  })

  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
}

function sumAmount(transactions) {
  return transactions.reduce((sum, t) => sum + t.amount, 0)
}

function sumByType(transactions, type) {
  return transactions.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0)
}

module.exports = {
  getAll,
  add,
  update,
  remove,
  getById,
  queryByDateRange,
  queryByDate,
  groupByDate,
  sumAmount,
  sumByType,
  normalizeType,
  setOnChange,
  getAllRaw
}
