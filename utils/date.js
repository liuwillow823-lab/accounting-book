/**
 * 日期工具
 */

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

/** 格式化为 YYYY-MM-DD */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 今天 YYYY-MM-DD */
function today() {
  return formatDate(new Date())
}

/** 友好展示：今天 / 昨天 / MM月DD日 */
function formatDateLabel(dateStr) {
  const todayStr = today()
  if (dateStr === todayStr) return '今天'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === formatDate(yesterday)) return '昨天'

  const parts = dateStr.split('-')
  return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`
}

/** 完整展示：2025年7月28日 周一 */
function formatDateFull(dateStr) {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const d = new Date(dateStr.replace(/-/g, '/'))
  const w = weekDays[d.getDay()]
  const parts = dateStr.split('-')
  return `${parts[0]}年${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日 周${w}`
}

/** 某月第一天和最后一天 YYYY-MM-DD */
function getMonthRange(year, month) {
  const first = `${year}-${pad(month)}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const last = `${year}-${pad(month)}-${pad(lastDay)}`
  return { first, last }
}

/** 当前月份 YYYY-MM */
function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

/** YYYY-MM → 2025年7月 */
function formatMonthLabel(monthStr) {
  const [year, month] = monthStr.split('-')
  return `${year}年${parseInt(month, 10)}月`
}

/** YYYY-MM → 7月（汇总标题用） */
function formatMonthShort(monthStr) {
  const month = monthStr.split('-')[1]
  return `${parseInt(month, 10)}月`
}

/** 月份偏移，delta 为 ±1 */
function addMonth(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

/** 比较两个 YYYY-MM，返回 -1 / 0 / 1 */
function compareMonth(a, b) {
  return a.localeCompare(b)
}

/** 从账单列表取最早月份，无数据时返回当前月 */
function getEarliestMonth(transactions) {
  if (!transactions || transactions.length === 0) {
    return currentMonth()
  }
  const earliest = transactions.reduce((min, t) => (t.date < min ? t.date : min), transactions[0].date)
  return earliest.slice(0, 7)
}

module.exports = {
  formatDate,
  today,
  formatDateLabel,
  formatDateFull,
  getMonthRange,
  currentMonth,
  formatMonthLabel,
  formatMonthShort,
  addMonth,
  compareMonth,
  getEarliestMonth
}
