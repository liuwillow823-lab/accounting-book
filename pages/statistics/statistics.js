const transactionModel = require('../../models/transaction')
const categoryModel = require('../../models/category')
const {
  today,
  currentMonth,
  getMonthRange,
  formatDateLabel,
  formatMonthLabel,
  formatMonthShort,
  addMonth,
  compareMonth,
  getEarliestMonth
} = require('../../utils/date')
const { centToDisplay } = require('../../utils/format')

const GRANULARITY = { day: 'day', week: 'week', month: 'month', year: 'year' }
const TYPES = { expense: 'expense', income: 'income' }
const COLORS = ['#07c160', '#1989fa', '#ff976a', '#ee0a24', '#7232dd', '#f2c94c', '#00bcd4', '#8b5cf6']

function formatMoney(v) { return centToDisplay(v).replace('¥', '') }

function pad(n) { return String(n).padStart(2, '0') }
function toDate(dateStr) { return new Date(`${dateStr}T00:00:00`) }
function formatYMD(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function getWeekRange(dateStr) {
  const d = toDate(dateStr)
  const day = d.getDay() || 7
  const start = new Date(d)
  start.setDate(d.getDate() - day + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: formatYMD(start), end: formatYMD(end) }
}

Page({
  data: {
    type: TYPES.expense,
    granularity: GRANULARITY.month,
    selectedDate: today(),
    selectedWeek: today(),
    selectedMonth: currentMonth(),
    selectedYear: String(new Date().getFullYear()),
    selectedFilterDate: today(),
    pickerStart: '',
    pickerEnd: '',
    title: '支出统计',
    rangeLabel: '',
    totalDisplay: '¥0.00',
    totalCount: 0,
    empty: false,
    trendSubtitle: '',
    linePoints: [],
    lineSegments: [],
    activePointIndex: -1,
    activePointLabel: '',
    activePointValue: '',
    pieItems: [],
    pieStyle: '',
    pieSubtotal: 0,
    pieSubtitle: '',
    pieLevel: 'category',
    pieParentCategoryId: '',
    pieParentCategoryName: '',
    pieCenterLabel: '总额',
    pieCenterValue: '¥0.00',
    pieLabels: [],
    pieCenterAmount: 0,
    pieHitItems: [],
    pieCanvasSize: null,
    filterLabel: formatMonthLabel(currentMonth()),
    showFilterPanel: false,
    yearOptions: [],
    monthOptions: [],
    selectedFilterYearIndex: 0,
    selectedFilterMonthIndex: 0,
    todayStr: today(),
    currentMonthStr: currentMonth(),
    selectedMonthLabel: formatMonthLabel(currentMonth()),
    selectedYearLabel: String(new Date().getFullYear()),
    selectedWeekLabel: '',
    weekOptions: []
  },

  onLoad() {
    this.initFilterOptions()
    this.loadStats()
  },
  onReady() { this.drawCharts() },
  onShow() { this.loadStats() },

  initFilterOptions() {
    const now = today()
    const nowYear = Number(now.slice(0, 4))
    const nowMonth = Number(now.slice(5, 7))
    const yearOptions = []
    for (let y = nowYear - 3; y <= nowYear; y += 1) yearOptions.push(String(y))
    const monthOptions = []
    for (let m = 1; m <= nowMonth; m += 1) monthOptions.push(`${m}月`)
    const weekOptions = []
    const cursor = toDate(now)
    for (let i = 0; i < 12; i += 1) {
      const date = new Date(cursor)
      date.setDate(cursor.getDate() - i * 7)
      const range = getWeekRange(formatYMD(date))
      if (range.end > now) continue
      weekOptions.push({ value: range.start, label: `${range.start.slice(5)}~${range.end.slice(5)}` })
    }
    this.setData({ yearOptions, monthOptions, weekOptions, selectedWeekLabel: weekOptions[0] ? weekOptions[0].label : '' })
  },

  loadStats() {
    const all = transactionModel.getAll()
    this.setData({ pickerStart: getEarliestMonth(all), pickerEnd: currentMonth() }, () => this.rebuildStats())
  },

  resolveRange() {
    const { type, granularity, selectedDate, selectedWeek, selectedMonth, selectedYear } = this.data
    let rangeLabel = ''
    let trendSubtitle = ''
    let pieSubtitle = ''
    let start = ''
    let end = ''

    if (granularity === GRANULARITY.day) {
      start = end = selectedDate
      rangeLabel = formatDateLabel(selectedDate)
      trendSubtitle = '日统计不展示走势图'
      pieSubtitle = `${type === 'income' ? '当日收入' : '当日支出'}分类占比`
    } else if (granularity === GRANULARITY.week) {
      const r = getWeekRange(selectedWeek)
      start = r.start
      end = r.end
      rangeLabel = `${r.start.slice(5)} ~ ${r.end.slice(5)}`
      trendSubtitle = `${type === 'income' ? '本周收入' : '本周支出'}走势`
      pieSubtitle = `${type === 'income' ? '本周收入' : '本周支出'}分类占比`
    } else if (granularity === GRANULARITY.month) {
      const [year, month] = selectedMonth.split('-').map(Number)
      const r = getMonthRange(year, month)
      start = r.first
      end = r.last
      rangeLabel = formatMonthLabel(selectedMonth)
      trendSubtitle = `${formatMonthShort(selectedMonth)}${type === 'income' ? '收入' : '支出'}折线图`
      pieSubtitle = `${formatMonthShort(selectedMonth)}${type === 'income' ? '收入' : '支出'}分类占比`
    } else {
      const year = Number(selectedYear)
      start = `${year}-01-01`
      end = `${year}-12-31`
      rangeLabel = `${year}年`
      trendSubtitle = `${year}${type === 'income' ? '收入' : '支出'}走势`
      pieSubtitle = `${year}${type === 'income' ? '收入' : '支出'}分类占比`
    }

    return { start, end, rangeLabel, trendSubtitle, pieSubtitle }
  },

  rebuildStats() {
    const { type, granularity, selectedMonth, selectedDate, selectedWeek, selectedYear } = this.data
    const { start, end, rangeLabel, trendSubtitle, pieSubtitle } = this.resolveRange()

    let list = transactionModel.queryByDateRange(start, end, type)
    let title = type === 'income' ? '收入统计' : '支出统计'

    if (granularity === GRANULARITY.day) {
      list = transactionModel.queryByDate(selectedDate, type)
    }

    const total = transactionModel.sumAmount(list)
    const trend = this.buildTrend(granularity, list, type, selectedMonth, selectedYear, selectedWeek)
    const pie = type === 'expense'
      ? this.buildExpensePie(list)
      : this.buildPie(list, type)

    this.setData({
      title,
      rangeLabel,
      totalDisplay: centToDisplay(total),
      totalCount: list.length,
      empty: list.length === 0,
      trendSubtitle,
      linePoints: trend.points,
      lineSegments: trend.segments,
      activePointIndex: -1,
      activePointLabel: '',
      activePointValue: '',
      pieItems: pie.items,
      pieStyle: this.buildPieStyle(pie.items),
      pieSubtotal: total,
      pieSubtitle,
      pieLevel: pie.level || 'category',
      pieParentCategoryId: pie.parentCategoryId || '',
      pieParentCategoryName: pie.parentCategoryName || '',
      pieCenterLabel: pie.centerLabel || '总额',
      pieCenterValue: pie.centerValue || centToDisplay(total),
      pieCenterAmount: pie.centerAmount || total,
      pieLabels: this.buildPieLabels(pie.items),
      pieHitItems: pie.items,
      filterLabel: granularity === GRANULARITY.week ? `${rangeLabel}` : granularity === GRANULARITY.month ? formatMonthLabel(selectedMonth) : `${selectedYear}年`,
      selectedMonthLabel: `${Number(selectedMonth.split('-')[1])}月`,
      selectedYearLabel: selectedYear,
      selectedWeekLabel: this.getWeekLabel(selectedWeek)
    }, () => this.drawCharts())
  },

  buildTrend(granularity, list, type, selectedMonth, selectedYear, selectedWeek) {
    if (granularity === GRANULARITY.day) return { points: [], segments: [] }

    let labels = []
    let values = []
    const amountByDate = {}
    list.forEach(txn => { amountByDate[txn.date] = (amountByDate[txn.date] || 0) + txn.amount })

    if (granularity === GRANULARITY.week) {
      const r = getWeekRange(selectedWeek)
      labels = []
      values = []
      for (let i = 0; i < 7; i += 1) {
        const d = toDate(r.start)
        d.setDate(d.getDate() + i)
        const date = formatYMD(d)
        labels.push(String(d.getDate()))
        values.push(amountByDate[date] || 0)
      }
    } else if (granularity === GRANULARITY.month) {
      const [year, month] = selectedMonth.split('-').map(Number)
      const daysInMonth = new Date(year, month, 0).getDate()
      labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))
      values = labels.map((_, i) => amountByDate[`${selectedMonth}-${pad(i + 1)}`] || 0)
    } else {
      const year = Number(selectedYear)
      labels = Array.from({ length: 12 }, (_, i) => `${i + 1}`)
      values = labels.map((_, i) => {
        const { first, last } = getMonthRange(year, i + 1)
        return transactionModel.sumAmount(transactionModel.queryByDateRange(first, last, type))
      })
    }

    const max = Math.max(...values, 1)
    const points = values.map((value, index) => ({
      label: labels[index],
      x: values.length === 1 ? 50 : (index / (values.length - 1)) * 100,
      y: 100 - (value / max) * 100,
      value,
      display: formatMoney(value)
    }))

    const segments = []
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1]
      const curr = points[i]
      if (prev.value === 0 && curr.value === 0) continue
      const dx = curr.x - prev.x
      const dy = curr.y - prev.y
      const length = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      segments.push({ x: prev.x, y: prev.y, length, angle, hidden: false })
    }
    return { points, segments }
  },

  buildPie(list, type) {
    const map = {}
    list.forEach(txn => {
      const key = txn.categoryId
      if (!map[key]) {
        const cat = categoryModel.findCategory(txn.categoryId, type)
        map[key] = { id: key, name: cat ? cat.name : txn.categoryName, icon: cat ? cat.icon : txn.categoryIcon, amount: 0 }
      }
      map[key].amount += txn.amount
    })
    const items = Object.values(map).sort((a, b) => b.amount - a.amount)
    const total = items.reduce((s, i) => s + i.amount, 0)
    let acc = 0
    return {
      level: 'category',
      centerLabel: '总额',
      centerValue: centToDisplay(total),
      centerAmount: total,
      items: items.map((item, index) => {
        const percent = total ? (item.amount / total) * 100 : 0
        const deg = total ? (item.amount / total) * 360 : 0
        const start = acc
        acc += deg
        return { ...item, color: COLORS[index % COLORS.length], percent: percent.toFixed(1), amountDisplay: centToDisplay(item.amount), start, deg }
      })
    }
  },

  buildExpensePie(list) {
    if (!list.length) return { level: 'category', items: [] }
    const byCategory = {}
    list.forEach(txn => {
      const cid = txn.categoryId
      if (!byCategory[cid]) {
        const cat = categoryModel.findCategory(cid, 'expense')
        byCategory[cid] = { id: cid, name: cat ? cat.name : txn.categoryName, icon: cat ? cat.icon : txn.categoryIcon, amount: 0, items: [] }
      }
      byCategory[cid].amount += txn.amount
      byCategory[cid].items.push(txn)
    })

    const selectedParent = this.data.pieParentCategoryId
    if (selectedParent) {
      const parent = byCategory[selectedParent]
      const parentItems = parent ? parent.items : []
      const subMap = {}
      parentItems.forEach(txn => {
        const sid = txn.subCategoryId || 'unknown'
        if (!subMap[sid]) subMap[sid] = { id: sid, name: txn.subCategoryName || '未分类', icon: txn.categoryIcon, amount: 0 }
        subMap[sid].amount += txn.amount
      })
      const items = Object.values(subMap).sort((a, b) => b.amount - a.amount)
      const total = items.reduce((s, i) => s + i.amount, 0)
      let acc = 0
      return {
        level: 'subCategory',
        parentCategoryId: selectedParent,
        parentCategoryName: parent ? parent.name : '',
        centerLabel: parent ? parent.name : '总额',
        centerValue: parent ? centToDisplay(parent.amount) : centToDisplay(total),
        centerAmount: parent ? parent.amount : total,
        items: items.map((item, index) => {
          const percent = total ? (item.amount / total) * 100 : 0
          const deg = total ? (item.amount / total) * 360 : 0
          const start = acc
          acc += deg
          return { ...item, color: COLORS[index % COLORS.length], percent: percent.toFixed(1), amountDisplay: centToDisplay(item.amount), start, deg }
        })
      }
    }

    const items = Object.values(byCategory).sort((a, b) => b.amount - a.amount)
    const total = items.reduce((s, i) => s + i.amount, 0)
    let acc = 0
    return {
      level: 'category',
      items: items.map((item, index) => {
        const percent = total ? (item.amount / total) * 100 : 0
        const deg = total ? (item.amount / total) * 360 : 0
        const start = acc
        acc += deg
        return { ...item, color: COLORS[index % COLORS.length], percent: percent.toFixed(1), amountDisplay: centToDisplay(item.amount), start, deg }
      })
    }
  },

  buildPieStyle(items) {
    if (!items.length) return 'conic-gradient(#f0f0f0 0deg 360deg)'
    const parts = []
    let current = 0
    items.forEach(item => { const end = current + item.deg; parts.push(`${item.color} ${current}deg ${end}deg`); current = end })
    return `conic-gradient(${parts.join(', ')})`
  },

  buildPieLabels(items, size) {
    const canvasSize = size || this.data.pieCanvasSize
    if (!canvasSize || !items.length) return []

    const w = canvasSize.width
    const h = canvasSize.height
    const cx = w / 2
    const cy = h / 2
    const radius = Math.min(w, h) * 0.35
    const labelRadius = radius * 1.32
    const minGap = 34

    const raw = []
    let start = -Math.PI / 2
    items.forEach(item => {
      const angle = (item.deg / 180) * Math.PI
      const mid = start + angle / 2
      const x = cx + Math.cos(mid) * labelRadius
      const y = cy + Math.sin(mid) * labelRadius
      raw.push({
        id: item.id,
        name: item.name,
        icon: item.icon,
        amountDisplay: item.amountDisplay,
        percent: item.percent,
        color: item.color,
        x,
        y,
        mid,
        align: x < cx ? 'left' : 'right'
      })
      start += angle
    })

    const left = raw.filter(i => i.x < cx).sort((a, b) => a.y - b.y)
    const right = raw.filter(i => i.x >= cx).sort((a, b) => a.y - b.y)

    const spread = list => {
      for (let i = 1; i < list.length; i += 1) {
        if (list[i].y - list[i - 1].y < minGap) list[i].y = list[i - 1].y + minGap
      }
      if (!list.length) return
      const minY = 18
      const maxY = h - 18
      if (list[0].y < minY) {
        const shift = minY - list[0].y
        list.forEach(i => { i.y += shift })
      }
      if (list[list.length - 1].y > maxY) {
        const shift = list[list.length - 1].y - maxY
        list.forEach(i => { i.y -= shift })
      }
      for (let i = 1; i < list.length; i += 1) {
        if (list[i].y - list[i - 1].y < minGap) list[i].y = list[i - 1].y + minGap
      }
    }

    spread(left)
    spread(right)

    const merged = [...left, ...right]
    return raw.map(item => {
      const matched = merged.find(i => i.id === item.id) || item
      return {
        id: item.id,
        name: item.name,
        icon: item.icon,
        amountDisplay: item.amountDisplay,
        percent: item.percent,
        color: item.color,
        labelLeft: matched.x,
        labelTop: matched.y,
        labelAlign: matched.align
      }
    })
  },

  drawCharts() { if (this.data.granularity !== GRANULARITY.day) this.drawTrendCanvas(); this.drawPieCanvas() },

  drawTrendCanvas() {
    const query = wx.createSelectorQuery().in(this)
    query.select('#trendCanvas').boundingClientRect(rect => {
      if (!rect || !this.data.linePoints.length) return
      const ctx = wx.createCanvasContext('trendCanvas', this)
      const w = rect.width
      const h = rect.height
      const padL = 40, padR = 20, padT = 24, padB = 42
      const chartW = w - padL - padR
      const chartH = h - padT - padB
      const points = this.data.linePoints.map(p => ({ ...p, px: padL + (p.x / 100) * chartW, py: padT + (p.y / 100) * chartH }))
      ctx.clearRect(0, 0, w, h)
      ctx.setStrokeStyle('#eef0f3'); ctx.setLineWidth(1)
      for (let i = 0; i < 4; i += 1) { const y = padT + (chartH / 3) * i; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke() }
      ctx.setStrokeStyle('#07c160'); ctx.setLineWidth(3); ctx.setLineCap('round'); ctx.setLineJoin('round')
      for (let i = 1; i < points.length; i += 1) { const prev = points[i - 1]; const curr = points[i]; ctx.beginPath(); ctx.moveTo(prev.px, prev.py); ctx.lineTo(curr.px, curr.py); ctx.stroke() }
      points.forEach((p, index) => { ctx.beginPath(); ctx.setFillStyle('#07c160'); ctx.arc(p.px, p.py, index === this.data.activePointIndex ? 5 : 4, 0, Math.PI * 2); ctx.fill(); ctx.setFillStyle('#969799'); ctx.setFontSize(10); ctx.setTextAlign('center'); ctx.fillText(p.label, p.px, h - 16) })
      if (this.data.activePointIndex >= 0) { const p = points[this.data.activePointIndex]; if (p) { ctx.setFillStyle('#323233'); ctx.setFontSize(11); ctx.fillText(p.display, p.px, Math.max(14, p.py - 10)) } }
      ctx.draw()
    }).exec()
  },

  drawPieCanvas() {
    const query = wx.createSelectorQuery().in(this)
    query.select('#pieCanvas').boundingClientRect(rect => {
      if (!rect || !this.data.pieItems.length) return
      const ctx = wx.createCanvasContext('pieCanvas', this)
      const w = rect.width, h = rect.height, cx = w / 2, cy = h / 2
      const canvasSize = { width: w, height: h, cx, cy }
      this.setData({ pieCanvasSize: canvasSize, pieLabels: this.buildPieLabels(this.data.pieItems, canvasSize) })
      const radius = Math.min(w, h) * 0.35
      const inner = radius * 0.62
      let start = -Math.PI / 2
      ctx.clearRect(0, 0, w, h)
      this.data.pieItems.forEach(item => {
        const angle = (item.deg / 180) * Math.PI
        const mid = start + angle / 2
        ctx.beginPath(); ctx.setFillStyle(item.color); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, start, start + angle); ctx.closePath(); ctx.fill()
        if (item.deg >= 14) {
          const labelRadius = radius * 1.2
          const labelX = cx + Math.cos(mid) * labelRadius
          const labelY = cy + Math.sin(mid) * labelRadius
          const lineEndX = cx + Math.cos(mid) * (radius * 1.05)
          const lineEndY = cy + Math.sin(mid) * (radius * 1.05)
          const alignLeft = labelX < cx
          const textX = labelX + (alignLeft ? -6 : 6)
          ctx.setStrokeStyle('rgba(0,0,0,0.12)')
          ctx.setLineWidth(1)
          ctx.beginPath()
          ctx.moveTo(lineEndX, lineEndY)
          ctx.lineTo(labelX, labelY)
          ctx.stroke()
          ctx.setFillStyle('#323233')
          ctx.setFontSize(10)
          ctx.setTextAlign(alignLeft ? 'right' : 'left')
          const nameText = item.name.length > 4 ? `${item.name.slice(0, 4)}…` : item.name
          ctx.fillText(`${nameText} ${item.percent}%`, textX, labelY)
          ctx.setFillStyle('#969799')
          ctx.setFontSize(9)
          ctx.fillText(item.amountDisplay, textX, labelY + 14)
        }
        start += angle
      })
      ctx.beginPath(); ctx.setFillStyle('#fff'); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fill()
      ctx.setFillStyle('#323233'); ctx.setTextAlign('center'); ctx.setFontSize(16); ctx.fillText(formatMoney(this.data.pieCenterAmount || this.data.pieSubtotal), cx, cy - 4)
      ctx.setFillStyle('#969799'); ctx.setFontSize(10); ctx.fillText(this.data.pieCenterLabel || '总额', cx, cy + 14)
      ctx.draw()
    }).exec()
  },

  onTrendCanvasTap(e) {
    if (!this.data.linePoints.length) return
    const query = wx.createSelectorQuery().in(this)
    query.select('#trendCanvas').boundingClientRect(rect => {
      if (!rect) return
      const x = e.detail.x - rect.left
      const y = e.detail.y - rect.top
      const w = rect.width, h = rect.height, padL = 40, padR = 20, padT = 24, padB = 42
      const chartW = w - padL - padR, chartH = h - padT - padB
      const points = this.data.linePoints.map(p => ({ ...p, px: padL + (p.x / 100) * chartW, py: padT + (p.y / 100) * chartH }))
      let best = -1, bestDist = Infinity
      points.forEach((p, index) => { const dx = x - p.px; const dy = y - p.py; const dist = Math.sqrt(dx * dx + dy * dy); if (dist < bestDist) { bestDist = dist; best = index } })
      const point = points[best]
      if (!point) return
      this.setData({ activePointIndex: best, activePointLabel: point.label, activePointValue: point.value > 0 ? point.display : '' }, () => this.drawTrendCanvas())
    }).exec()
  },

  onFilterTap() { this.setData({ showFilterPanel: true }) },
  onCancelFilter() { this.setData({ showFilterPanel: false }) },
  onYearColumnChange(e) { this.setData({ selectedFilterYearIndex: Number(e.detail.value) }) },
  onMonthColumnChange(e) { this.setData({ selectedFilterMonthIndex: Number(e.detail.value) }) },
  onConfirmFilter() {
    this.setData({ showFilterPanel: false })
  },

  onPieBack() {
    this.setData({ pieParentCategoryId: '', pieParentCategoryName: '' }, () => this.rebuildStats())
  },

  onPieCanvasTap() {
    if (this.data.type !== 'expense') return
    if (this.data.pieLevel !== 'category') return
    const first = this.data.pieItems[0]
    if (!first) return
    this.setData({ pieParentCategoryId: first.id, pieParentCategoryName: first.name }, () => this.rebuildStats())
  },

  onPieLabelTap(e) {
    if (this.data.type !== 'expense' || this.data.pieLevel !== 'category') return
    const id = e.currentTarget.dataset.id
    const item = this.data.pieHitItems.find(i => i.id === id)
    if (!item) return
    this.setData({ pieParentCategoryId: id, pieParentCategoryName: item.name }, () => this.rebuildStats())
  },

  onPieItemTap(e) {
    if (this.data.type !== 'expense') return
    const id = e.currentTarget.dataset.id
    const item = this.data.pieItems.find(i => i.id === id)
    if (!item) return
    if (this.data.pieLevel === 'category') {
      this.setData({ pieParentCategoryId: id, pieParentCategoryName: item.name }, () => this.rebuildStats())
    }
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ type, activePointIndex: -1, pieParentCategoryId: '', pieParentCategoryName: '' }, () => this.rebuildStats())
  },

  onGranularityChange(e) {
    const granularity = e.currentTarget.dataset.type
    this.setData({ granularity }, () => this.rebuildStats())
  },

  onDateChange(e) {
    const value = e.detail.value
    if (value > today()) return wx.showToast({ title: '不能选择未来日期', icon: 'none' })
    this.setData({ selectedDate: value }, () => this.rebuildStats())
  },
  onMonthChange(e) {
    const value = e.detail.value.slice(0, 7)
    if (value > currentMonth()) return wx.showToast({ title: '不能选择未来月份', icon: 'none' })
    this.setData({ selectedMonth: value, selectedMonthLabel: formatMonthLabel(value) }, () => this.rebuildStats())
  },

  getWeekLabel(dateStr) {
    const range = getWeekRange(dateStr)
    return `${range.start.slice(5)}~${range.end.slice(5)}`
  },

  onWeekQuickPick(e) {
    const value = e.currentTarget.dataset.value
    if (value > today()) return wx.showToast({ title: '不能选择未来周', icon: 'none' })
    this.setData({ selectedWeek: value, selectedWeekLabel: this.getWeekLabel(value) }, () => this.rebuildStats())
  },

  onYearQuickPick(e) {
    const value = e.currentTarget.dataset.year
    if (Number(value) > Number(today().slice(0, 4))) return wx.showToast({ title: '不能选择未来年份', icon: 'none' })
    this.setData({ selectedYear: value, selectedYearLabel: value }, () => this.rebuildStats())
  },

  onMonthQuickPick(e) {
    const value = e.currentTarget.dataset.month
    const monthNum = Number(value.replace('月', ''))
    const year = this.data.selectedYear || String(new Date().getFullYear())
    const selected = `${year}-${pad(monthNum)}`
    if (selected > currentMonth()) return wx.showToast({ title: '不能选择未来月份', icon: 'none' })
    this.setData({ selectedMonth: selected, selectedMonthLabel: value }, () => this.rebuildStats())
  },
  onYearChange(e) {
    const value = e.detail.value
    if (Number(value) > Number(today().slice(0, 4))) return wx.showToast({ title: '不能选择未来年份', icon: 'none' })
    this.setData({ selectedYear: value }, () => this.rebuildStats())
  },
  onWeekChange(e) {
    const value = e.detail.value
    if (value > today()) return wx.showToast({ title: '不能选择未来周', icon: 'none' })
    this.setData({ selectedWeek: value }, () => this.rebuildStats())
  },
  onPrevMonth() { if (compareMonth(this.data.selectedMonth, this.data.pickerStart) > 0) this.setData({ selectedMonth: addMonth(this.data.selectedMonth, -1) }, () => this.rebuildStats()) },
  onNextMonth() { if (compareMonth(this.data.selectedMonth, this.data.pickerEnd) < 0) this.setData({ selectedMonth: addMonth(this.data.selectedMonth, 1) }, () => this.rebuildStats()) },
  onPrevYear() { this.setData({ selectedYear: String(Number(this.data.selectedYear) - 1) }, () => this.rebuildStats()) },
  onNextYear() { this.setData({ selectedYear: String(Number(this.data.selectedYear) + 1) }, () => this.rebuildStats()) }
})
