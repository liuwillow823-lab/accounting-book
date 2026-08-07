const transactionModel = require('../../models/transaction')
const {
  formatDateLabel,
  getMonthRange,
  currentMonth,
  formatMonthLabel,
  formatMonthShort,
  addMonth,
  compareMonth,
  getEarliestMonth
} = require('../../utils/date')
const { centToDisplay } = require('../../utils/format')

Page({
  data: {
    selectedMonth: '',
    monthLabel: '',
    summaryTitle: '',
    pickerStart: '',
    pickerEnd: '',
    canGoPrev: false,
    canGoNext: false,
    hasAnyTransaction: false,
    totalDisplay: '¥0.00',
    totalCount: 0,
    groups: [],
    incomeTotalDisplay: '¥0.00',
    expenseTotalDisplay: '¥0.00'
  },

  onLoad() {
    const now = currentMonth()
    this.setData({ selectedMonth: now })
    this.loadData()
  },

  onShow() {
    if (this.data.selectedMonth) {
      this.loadData()
    }
  },

  loadData() {
    const { selectedMonth } = this.data
    const all = transactionModel.getAll()
    const hasAnyTransaction = all.length > 0
    const pickerEnd = currentMonth()
    const pickerStart = getEarliestMonth(all)

    const [year, month] = selectedMonth.split('-').map(Number)
    const { first, last } = getMonthRange(year, month)
    const monthList = transactionModel.queryByDateRange(first, last)
    const incomeList = monthList.filter(txn => txn.type === 'income')
    const expenseList = monthList.filter(txn => txn.type === 'expense')
    const incomeTotal = transactionModel.sumAmount(incomeList)
    const expenseTotal = transactionModel.sumAmount(expenseList)
    const groups = transactionModel.groupByDate(monthList).map(group => ({
      ...group,
      dateLabel: formatDateLabel(group.date),
      incomeDisplay: centToDisplay(transactionModel.sumByType(group.items, 'income')),
      expenseDisplay: centToDisplay(transactionModel.sumByType(group.items, 'expense')),
      items: group.items.map(txn => ({
        ...txn,
        amountDisplay: centToDisplay(txn.amount).replace('¥', ''),
        amountSign: txn.type === 'income' ? '+' : '-'
      }))
    }))

    this.setData({
      hasAnyTransaction,
      pickerStart,
      pickerEnd,
      monthLabel: formatMonthLabel(selectedMonth),
      summaryTitle: `${formatMonthShort(selectedMonth)}收支`,
      canGoPrev: compareMonth(selectedMonth, pickerStart) > 0,
      canGoNext: compareMonth(selectedMonth, pickerEnd) < 0,
      incomeTotalDisplay: centToDisplay(incomeTotal),
      expenseTotalDisplay: centToDisplay(expenseTotal),
      totalDisplay: `${centToDisplay(incomeTotal)} / ${centToDisplay(expenseTotal)}`,
      totalCount: monthList.length,
      groups
    })
  },

  onMonthPick(e) {
    const selectedMonth = e.detail.value.slice(0, 7)
    this.setData({ selectedMonth })
    this.loadData()
  },

  onPrevMonth() {
    if (!this.data.canGoPrev) return
    this.setData({ selectedMonth: addMonth(this.data.selectedMonth, -1) })
    this.loadData()
  },

  onNextMonth() {
    if (!this.data.canGoNext) return
    this.setData({ selectedMonth: addMonth(this.data.selectedMonth, 1) })
    this.loadData()
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  goEdit(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/add/add?id=${id}` })
  }
})
