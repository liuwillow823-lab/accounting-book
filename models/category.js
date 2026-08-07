const storage = require('../utils/storage')
const { STORAGE_KEYS, DEFAULT_CATEGORIES, DATA_VERSION } = require('../utils/constants')

function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, '')
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function getEmptyTree() {
  return { expense: [], income: [] }
}

function normalizeTree(tree) {
  if (Array.isArray(tree)) {
    return { expense: tree, income: [] }
  }
  return {
    expense: Array.isArray(tree?.expense) ? tree.expense : [],
    income: Array.isArray(tree?.income) ? tree.income : []
  }
}

function cloneCategories(list) {
  return list.map(cat => ({ ...cat, subCategories: Array.isArray(cat.subCategories) ? cat.subCategories.map(sub => ({ ...sub })) : [] }))
}

function mergeDefaultTree(existing) {
  const tree = normalizeTree(existing)
  const defaultTree = normalizeTree(DEFAULT_CATEGORIES)
  return {
    expense: tree.expense.length ? tree.expense : cloneCategories(defaultTree.expense),
    income: tree.income.length ? tree.income : cloneCategories(defaultTree.income)
  }
}

/** 首次启动时写入默认分类 */
function initCategories() {
  const version = storage.get(STORAGE_KEYS.VERSION, 0)
  const existingRaw = storage.get(STORAGE_KEYS.CATEGORIES, null)
  const merged = mergeDefaultTree(existingRaw)

  storage.set(STORAGE_KEYS.CATEGORIES, merged)
  if (version < DATA_VERSION) {
    storage.set(STORAGE_KEYS.VERSION, DATA_VERSION)
  }

  return merged
}

function getAll() {
  return normalizeTree(storage.get(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES))
}

function saveAll(categories) {
  return storage.set(STORAGE_KEYS.CATEGORIES, normalizeTree(categories))
}

function getCategoriesByType(type = 'expense') {
  const tree = getAll()
  return Array.isArray(tree[type]) ? tree[type] : []
}

function findCategory(categoryId, type = 'expense') {
  return getCategoriesByType(type).find(c => c.id === categoryId) || null
}

function findSubCategory(categoryId, subCategoryId, type = 'expense') {
  const cat = findCategory(categoryId, type)
  if (!cat) return null
  return cat.subCategories.find(s => s.id === subCategoryId) || null
}

function sortCategories(categories) {
  return [...categories]
    .map(cat => ({ ...cat, subCategories: [...cat.subCategories].sort((a, b) => a.sort - b.sort) }))
    .sort((a, b) => a.sort - b.sort)
}

function getNextSort(items) {
  if (!items.length) return 1
  return Math.max(...items.map(item => item.sort || 0)) + 1
}

function addCategory(name, icon = '📦', type = 'expense') {
  const normalized = normalizeName(name)
  if (!normalized) throw new Error('请输入大类名称')

  const tree = getAll()
  const categories = getCategoriesByType(type)
  if (categories.some(cat => normalizeName(cat.name) === normalized)) throw new Error('该大类已存在')

  const category = {
    id: generateId(`cat_${type}`),
    name: String(name).trim(),
    icon: icon || '📦',
    sort: getNextSort(categories),
    isDefault: false,
    subCategories: []
  }

  tree[type] = sortCategories([...categories, category])
  saveAll(tree)
  return category
}

function addSubCategory(categoryId, name, type = 'expense') {
  if (type === 'income') throw new Error('收入分类不支持小类')
  const normalized = normalizeName(name)
  if (!normalized) throw new Error('请输入小类名称')

  const tree = getAll()
  const categories = getCategoriesByType(type)
  const index = categories.findIndex(cat => cat.id === categoryId)
  if (index === -1) throw new Error('大类不存在')

  const cat = categories[index]
  if (cat.subCategories.some(sub => normalizeName(sub.name) === normalized)) throw new Error('该小类已存在')

  const subCategory = {
    id: generateId(`sub_${type}`),
    name: String(name).trim(),
    sort: getNextSort(cat.subCategories),
    isDefault: false
  }

  const next = [...categories]
  next[index] = { ...cat, subCategories: [...cat.subCategories, subCategory].sort((a, b) => a.sort - b.sort) }
  tree[type] = sortCategories(next)
  saveAll(tree)
  return subCategory
}

function getCategoryTree(type = 'expense') {
  return sortCategories(getCategoriesByType(type))
}

function getFlatSubCategories(type = 'expense') {
  const result = []
  getCategoryTree(type).forEach(cat => {
    cat.subCategories.forEach(sub => {
      result.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        subCategoryId: sub.id,
        subCategoryName: sub.name,
        label: `${cat.icon} ${cat.name} · ${sub.name}`
      })
    })
  })
  return result
}

module.exports = {
  initCategories,
  getAll,
  saveAll,
  findCategory,
  findSubCategory,
  getFlatSubCategories,
  addCategory,
  addSubCategory,
  getCategoryTree,
  getCategoriesByType
}
