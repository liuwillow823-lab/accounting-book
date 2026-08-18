const storage = require('../../utils/storage')

const PROFILE_KEY = 'profileInfo'

function generateDefaultNickname() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 6; i += 1) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return `懂你_${s}`
}

Page({
  data: {
    loggedIn: false,
    nickName: '',
    avatarUrl: '',
    loginLoading: false
  },

  onShow() {
    this.refreshLoginState()
  },

  refreshLoginState() {
    const loginInfo = storage.get('loginInfo', null)
    const profile = storage.get(PROFILE_KEY, null) || {}
    this.setData({
      loggedIn: !!loginInfo,
      nickName: profile.nickName || '',
      avatarUrl: profile.avatarUrl || ''
    })
  },

  async onLogin() {
    if (this.data.loginLoading) return
    if (!wx.cloud) {
      wx.showToast({ title: '当前微信版本过低，无法登录', icon: 'none' })
      return
    }
    this.setData({ loginLoading: true })
    try {
      const res = await wx.cloud.callFunction({ name: 'login' })
      const openid = res && res.result && res.result.openid
      if (!openid) throw new Error('登录失败，请重试')
      storage.set('loginInfo', { openid, loggedAt: Date.now() })
      if (!storage.get(PROFILE_KEY, null)) {
        storage.set(PROFILE_KEY, { nickName: generateDefaultNickname(), avatarUrl: '' })
      }
      this.refreshLoginState()
      wx.showToast({ title: '登录成功', icon: 'success' })
      // 登录后立即同步云端（老数据自动迁移）
      const app = getApp()
      if (app && app.syncNow) app.syncNow()
    } catch (err) {
      console.error('[profile.onLogin]', err)
      wx.showToast({ title: err.message || '登录失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loginLoading: false })
    }
  },

  onAvatarChoose(e) {
    const tempPath = e.detail.avatarUrl
    if (!tempPath) return
    wx.saveFile({
      tempFilePath: tempPath,
      success: (res) => {
        const profile = storage.get(PROFILE_KEY, {}) || {}
        profile.avatarUrl = res.savedFilePath
        storage.set(PROFILE_KEY, profile)
        this.setData({ avatarUrl: res.savedFilePath })
        wx.showToast({ title: '头像已更新', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '头像保存失败', icon: 'none' })
      }
    })
  },

  onNickChange(e) {
    const nickName = String(e.detail.value || '').trim()
    if (!nickName) return
    const profile = storage.get(PROFILE_KEY, {}) || {}
    profile.nickName = nickName
    storage.set(PROFILE_KEY, profile)
    this.setData({ nickName })
    wx.showToast({ title: '昵称已更新', icon: 'success' })
  },

  onSyncTip() {
    wx.showToast({ title: '云端账本功能即将上线', icon: 'none' })
  },

  onAbout() {
    wx.showModal({
      title: '关于本小程序',
      content: '懂你记账：记录收入与支出，支持月度账单与统计图表分析。当前版本数据保存在本机。',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})