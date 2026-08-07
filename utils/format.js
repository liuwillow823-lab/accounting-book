/**
 * 金额格式化（内部以「分」存储，避免浮点误差）
 */

/** 元字符串 → 分（整数） */
function yuanToCent(yuanStr) {
  if (!yuanStr || yuanStr === '.') return 0
  const num = parseFloat(yuanStr)
  if (isNaN(num) || num < 0) return 0
  return Math.round(num * 100)
}

/** 分 → 展示字符串 ¥28.50 */
function centToDisplay(cent) {
  const yuan = (cent / 100).toFixed(2)
  return `¥${yuan}`
}

/** 分 → 数字字符串 28.50（编辑回填用） */
function centToYuanStr(cent) {
  return (cent / 100).toFixed(2)
}

/** 校验金额输入，只允许数字和一个小数点，最多两位小数 */
function sanitizeAmountInput(value) {
  let v = String(value).replace(/[^\d.]/g, '')
  const dotIndex = v.indexOf('.')
  if (dotIndex !== -1) {
    v = v.slice(0, dotIndex + 1) + v.slice(dotIndex + 1).replace(/\./g, '')
    const parts = v.split('.')
    if (parts[1] && parts[1].length > 2) {
      v = parts[0] + '.' + parts[1].slice(0, 2)
    }
  }
  return v
}

module.exports = {
  yuanToCent,
  centToDisplay,
  centToYuanStr,
  sanitizeAmountInput
}
