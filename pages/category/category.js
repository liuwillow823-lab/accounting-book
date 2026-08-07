const categoryModel = require('../../models/category')

Page({
  data: {
    type: 'expense',
    categories: [],
    categoryName: '',
    categoryIcon: '📦',
    activeCategoryId: '',
    newSubName: ''
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const categories = categoryModel.getCategoryTree(this.data.type).map(cat => ({
      ...cat,
      subCategories: [...cat.subCategories].sort((a, b) => a.sort - b.sort)
    }))
    const activeCategoryId = this.data.activeCategoryId || (categories[0] && categories[0].id) || ''
    this.setData({ categories, activeCategoryId })
  },

  onSwitchType(e) {
    const type = e.currentTarget.dataset.type
    const categories = categoryModel.getCategoryTree(type)
    const activeCategoryId = categories[0] ? categories[0].id : ''
    this.setData({ type, activeCategoryId, newSubName: '', categoryName: '', categoryIcon: '📦' }, () => this.loadData())
  },

  onCategoryNameInput(e) {
    this.setData({ categoryName: e.detail.value })
  },

  onCategoryIconInput(e) {
    this.setData({ categoryIcon: e.detail.value || '📦' })
  },

  onAddCategory() {
    try {
      categoryModel.addCategory(this.data.categoryName, this.data.categoryIcon, this.data.type)
      this.setData({ categoryName: '', categoryIcon: '📦' })
      this.loadData()
      wx.showToast({ title: '已添加', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '添加失败', icon: 'none' })
    }
  },

  onSelectCategory(e) {
    this.setData({ activeCategoryId: e.currentTarget.dataset.id, newSubName: '' })
  },

  onSubNameInput(e) {
    this.setData({ newSubName: e.detail.value })
  },

  onAddSubCategory(e) {
    const categoryId = e.currentTarget.dataset.id || this.data.activeCategoryId
    try {
      categoryModel.addSubCategory(categoryId, this.data.newSubName, this.data.type)
      this.setData({ newSubName: '' })
      this.loadData()
      wx.showToast({ title: '已添加', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '添加失败', icon: 'none' })
    }
  }
})
