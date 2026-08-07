const categoryModel = require('./models/category')

App({
  globalData: {
    categories: []
  },

  onLaunch() {
    const categories = categoryModel.initCategories()
    this.globalData.categories = categories
    console.log('[App] 初始化完成，分类数:', categories.length)
  },

  /** 刷新全局分类缓存（分类管理页改动后调用） */
  refreshCategories() {
    this.globalData.categories = categoryModel.getAll()
  }
})
