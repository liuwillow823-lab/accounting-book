const transactionModel = require('../../models/transaction')
const { today, formatDateFull } = require('../../utils/date')
const { centToDisplay } = require('../../utils/format')

Page({
  data: {
    dateLabel: '',
    todayIncomeDisplay: '¥0.00',
    todayExpenseDisplay: '¥0.00',
    todayList: []
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const dateStr = today()
    const list = transactionModel.queryByDate(dateStr)
    const incomeTotal = transactionModel.sumByType(list, 'income')
    const expenseTotal = transactionModel.sumByType(list, 'expense')

    this.setData({
      dateLabel: formatDateFull(dateStr),
      todayTotalDisplay: centToDisplay(expenseTotal),
      todayIncomeDisplay: centToDisplay(incomeTotal),
      todayExpenseDisplay: centToDisplay(expenseTotal),
      todayList: list.map(item => ({
        ...item,
        amountDisplay: centToDisplay(item.amount).replace('¥', ''),
        amountSign: item.type === 'income' ? '+' : '-'
      }))
    })
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/add/add' })
  },

  goList() {
    wx.switchTab({ url: '/pages/list/list' })
  },

  goEdit(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/add/add?id=${id}` })
  }
})
