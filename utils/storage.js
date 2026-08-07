/**
 * 本地存储封装
 * 统一读写入口，便于后续做版本迁移或加密
 */

function get(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(key)
    if (value === '' || value === undefined || value === null) {
      return defaultValue
    }
    return value
  } catch (err) {
    console.error('[storage.get]', key, err)
    return defaultValue
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (err) {
    console.error('[storage.set]', key, err)
    wx.showToast({ title: '保存失败，存储空间可能已满', icon: 'none' })
    return false
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(key)
    return true
  } catch (err) {
    console.error('[storage.remove]', key, err)
    return false
  }
}

module.exports = { get, set, remove }
