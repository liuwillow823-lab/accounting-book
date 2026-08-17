const transactionModel = require('../../models/transaction')
const { currentMonth, getMonthRange, getEarliestMonth } = require('../../utils/date')
const { centToDisplay } = require('../../utils/format')

function moneyText(cent) {
  return centToDisplay(Math.abs(cent)).replace('¥', '')
}

Page({
  data: {
    selectedYear: '',
    pickerStart: '',
    pickerEnd: '',
    canGoPrev: false,
    canGoNext: false,
    hasAnyTransaction: false,
    monthRows: [],
    incomeTotalDisplay: '0.00',
    expenseTotalDisplay: '0.00',
    netTotalDisplay: '+0.00',
    netPositive: true
  },

  onLoad() {
    this.setData({ selectedYear: currentMonth().slice(0, 4) })
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const all = transactionModel.getAll()
    const hasAnyTransaction = all.length > 0
    const nowMonth = currentMonth()
    const currentYear = Number(nowMonth.slice(0, 4))
    const currentMonthNum = Number(nowMonth.slice(5, 7))
    const earliestYear = Number(getEarliestMonth(all).slice(0, 4))
    const selectedYear = Number(this.data.selectedYear || currentYear)

    const monthCount = selectedYear === currentYear ? currentMonthNum : 12
    const rows = []
    let incomeTotal = 0
    let expenseTotal = 0
    for (let m = 1; m <= monthCount; m += 1) {
      const { first, last } = getMonthRange(selectedYear, m)
      const list = transactionModel.queryByDateRange(first, last)
      const income = transactionModel.sumByType(list, 'income')
      const expense = transactionModel.sumByType(list, 'expense')
      incomeTotal += income
      expenseTotal += expense
      rows.push({
        month: `${m}月`,
        incomeDisplay: moneyText(income),
        expenseDisplay: moneyText(expense),
        netDisplay: (income - expense >= 0 ? '+' : '-') + moneyText(income - expense),
        netPositive: income - expense >= 0
      })
    }

    const net = incomeTotal - expenseTotal
    this.setData({
      hasAnyTransaction,
      canGoPrev: selectedYear > earliestYear,
      canGoNext: selectedYear < currentYear,
      pickerStart: String(earliestYear),
      pickerEnd: String(currentYear),
      monthRows: rows,
      incomeTotalDisplay: moneyText(incomeTotal),
      expenseTotalDisplay: moneyText(expenseTotal),
      netTotalDisplay: (net >= 0 ? '+' : '-') + moneyText(net),
      netPositive: net >= 0
    })
  },

  onYearPick(e) {
    const value = String(e.detail.value || '').slice(0, 4)
    if (!value) return
    this.setData({ selectedYear: value })
    this.loadData()
  },

  onPrevYear() {
    if (!this.data.canGoPrev) return
    this.setData({ selectedYear: String(Number(this.data.selectedYear) - 1) })
    this.loadData()
  },

  onNextYear() {
    if (!this.data.canGoNext) return
    this.setData({ selectedYear: String(Number(this.data.selectedYear) + 1) })
    this.loadData()
  }
})