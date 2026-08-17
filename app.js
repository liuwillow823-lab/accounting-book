const categoryModel = require('./models/category')
const storage = require('./utils/storage')
const transactionModel = require('./models/transaction')
const sync = require('./utils/sync')

App({
  globalData: {
    categories: [],
    loginInfo: null
  },

  onLaunch() {
    // 初始化云开发（默认环境；如创建了多个云环境，请传入 env 指定环境 ID）
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true })
    } else {
      console.error('当前基础库版本过低，请升级微信客户端')
    }

    // 读取本地登录态
    this.globalData.loginInfo = storage.get('loginInfo', null)

    const categories = categoryModel.initCategories()
    this.globalData.categories = categories
    console.log('[App] 初始化完成，分类数:', categories.length)

    // 本地改账后自动后台推送
    transactionModel.setOnChange(() => sync.schedulePush())

    // 已登录时启动云同步（拉取合并 + 推送老数据）
    if (this.globalData.loginInfo) {
      setTimeout(() => sync.syncAll(), 1500)
    }
  },

  /** 登录后调用：全量同步云端账本 */
  syncNow() {
    sync.syncAll()
  },

  /** 刷新全局分类缓存（分类管理页改动后调用） */
  refreshCategories() {
    this.globalData.categories = categoryModel.getAll()
  }
})