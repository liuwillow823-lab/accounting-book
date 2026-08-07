const transactionModel = require('../../models/transaction')
const categoryModel = require('../../models/category')
const { today, formatDateFull } = require('../../utils/date')
const { yuanToCent, sanitizeAmountInput } = require('../../utils/format')

Page({
  data: {
    isEdit: false,
    editId: '',
    type: 'expense',
    amountStr: '',
    amountFocus: true,
    categoryId: '',
    subCategoryId: '',
    date: '',
    maxDate: '',
    dateDisplay: '',
    remark: '',
    canSave: false,
    saving: false
  },

  onLoad(options) {
    const dateStr = today()
    const type = options.type === 'income' ? 'income' : 'expense'
    this.setData({
      type,
      date: dateStr,
      maxDate: dateStr,
      dateDisplay: formatDateFull(dateStr)
    })

    if (options.id) {
      this.loadTransaction(options.id)
    } else {
      const categories = categoryModel.getCategoryTree(type)
      const first = categories[0]
      const sub = first && first.subCategories[0]
      this.setData({
        categoryId: first ? first.id : '',
        subCategoryId: sub ? sub.id : ''
      })
      this.validateForm()
    }
  },

  loadTransaction(id) {
    const txn = transactionModel.getById(id)
    if (!txn) {
      wx.showToast({ title: '账单不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const { centToYuanStr } = require('../../utils/format')
    this.setData({
      isEdit: true,
      editId: id,
      type: txn.type || 'expense',
      amountStr: centToYuanStr(txn.amount),
      categoryId: txn.categoryId,
      subCategoryId: txn.subCategoryId,
      date: txn.date,
      dateDisplay: formatDateFull(txn.date),
      remark: txn.remark,
      amountFocus: false
    })
    this.validateForm()
  },

  onAmountInput(e) {
    const amountStr = sanitizeAmountInput(e.detail.value)
    this.setData({ amountStr })
    this.validateForm()
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    const categories = categoryModel.getCategoryTree(type)
    const first = categories[0]
    const sub = first && first.subCategories[0]
    this.setData({
      type,
      categoryId: first ? first.id : '',
      subCategoryId: sub ? sub.id : ''
    })
    this.validateForm()
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type
    const categories = categoryModel.getCategoryTree(type)
    const first = categories[0]
    const sub = first && first.subCategories[0]
    this.setData({
      type,
      categoryId: first ? first.id : '',
      subCategoryId: sub ? sub.id : ''
    })
    this.validateForm()
  },

  onCategoryChange(e) {
    const { categoryId, subCategoryId } = e.detail
    this.setData({ categoryId, subCategoryId })
    this.validateForm()
  },

  onDateChange(e) {
    const date = e.detail.value
    this.setData({
      date,
      dateDisplay: formatDateFull(date)
    })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  validateForm() {
    const { amountStr, categoryId, subCategoryId, type } = this.data
    const amount = yuanToCent(amountStr)
    const categoryReady = type === 'income' ? !!categoryId : !!categoryId && !!subCategoryId
    const canSave = amount > 0 && categoryReady
    this.setData({ canSave })
  },

  onSave() {
    if (!this.data.canSave || this.data.saving) return

    const { amountStr, categoryId, subCategoryId, date, remark, isEdit, editId, type } = this.data
    const amount = yuanToCent(amountStr)

    if (amount <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }

    if (type === 'income' && !categoryId) {
      wx.showToast({ title: '请选择收入分类', icon: 'none' })
      return
    }

    if (type === 'expense' && (!categoryId || !subCategoryId)) {
      wx.showToast({ title: '请选择支出分类', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    try {
      if (isEdit) {
        transactionModel.update(editId, { amount, categoryId, subCategoryId, date, remark, type })
        wx.showToast({ title: '已保存', icon: 'success' })
      } else {
        transactionModel.add({ amount, categoryId, subCategoryId, date, remark, type })
        wx.showToast({ title: '记账成功', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 800)
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
      this.setData({ saving: false })
    }
  },

  goCategoryManage() {
    wx.navigateTo({ url: '/pages/category/category' })
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定吗？',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          transactionModel.remove(this.data.editId)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 800)
        }
      }
    })
  }
})
