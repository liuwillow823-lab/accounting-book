// 存储 Key、默认分类、应用常量

const STORAGE_KEYS = {
  CATEGORIES: 'expense_categories',
  TRANSACTIONS: 'expense_transactions',
  SETTINGS: 'expense_settings',
  VERSION: 'expense_data_version'
}

const DATA_VERSION = 2

/** 预设分类：首次启动写入本地，之后用户可新增 */
const DEFAULT_CATEGORIES = {
  expense: [
    {
      id: 'cat_food',
      name: '餐饮',
      icon: '🍜',
      sort: 1,
      isDefault: true,
      subCategories: [
        { id: 'sub_breakfast', name: '早餐', sort: 1, isDefault: true },
        { id: 'sub_lunch', name: '午餐', sort: 2, isDefault: true },
        { id: 'sub_dinner', name: '晚餐', sort: 3, isDefault: true },
        { id: 'sub_snack', name: '夜宵', sort: 4, isDefault: true },
        { id: 'sub_milktea', name: '奶茶', sort: 5, isDefault: true },
        { id: 'sub_coffee', name: '咖啡', sort: 6, isDefault: true },
        { id: 'sub_delivery', name: '外卖', sort: 7, isDefault: true },
        { id: 'sub_dining', name: '聚餐', sort: 8, isDefault: true }
      ]
    },
    {
      id: 'cat_transport',
      name: '交通',
      icon: '🚌',
      sort: 2,
      isDefault: true,
      subCategories: [
        { id: 'sub_metro', name: '地铁', sort: 1, isDefault: true },
        { id: 'sub_bus', name: '公交', sort: 2, isDefault: true },
        { id: 'sub_taxi', name: '打车', sort: 3, isDefault: true },
        { id: 'sub_fuel', name: '加油', sort: 4, isDefault: true },
        { id: 'sub_parking', name: '停车', sort: 5, isDefault: true },
        { id: 'sub_bike', name: '共享单车', sort: 6, isDefault: true }
      ]
    },
    {
      id: 'cat_shopping',
      name: '购物',
      icon: '🛒',
      sort: 3,
      isDefault: true,
      subCategories: [
        { id: 'sub_daily', name: '日用品', sort: 1, isDefault: true },
        { id: 'sub_clothes', name: '服饰', sort: 2, isDefault: true },
        { id: 'sub_digital', name: '数码', sort: 3, isDefault: true },
        { id: 'sub_home', name: '家居', sort: 4, isDefault: true },
        { id: 'sub_online', name: '网购', sort: 5, isDefault: true }
      ]
    },
    {
      id: 'cat_housing',
      name: '居住',
      icon: '🏠',
      sort: 4,
      isDefault: true,
      subCategories: [
        { id: 'sub_rent', name: '房租', sort: 1, isDefault: true },
        { id: 'sub_utility', name: '水电燃气', sort: 2, isDefault: true },
        { id: 'sub_property', name: '物业费', sort: 3, isDefault: true },
        { id: 'sub_repair', name: '维修', sort: 4, isDefault: true }
      ]
    },
    {
      id: 'cat_entertainment',
      name: '娱乐',
      icon: '🎮',
      sort: 5,
      isDefault: true,
      subCategories: [
        { id: 'sub_movie', name: '电影', sort: 1, isDefault: true },
        { id: 'sub_game', name: '游戏', sort: 2, isDefault: true },
        { id: 'sub_sport', name: '运动', sort: 3, isDefault: true },
        { id: 'sub_travel', name: '旅行', sort: 4, isDefault: true },
        { id: 'sub_party', name: '聚会', sort: 5, isDefault: true }
      ]
    },
    {
      id: 'cat_medical',
      name: '医疗',
      icon: '💊',
      sort: 6,
      isDefault: true,
      subCategories: [
        { id: 'sub_medicine', name: '药品', sort: 1, isDefault: true },
        { id: 'sub_clinic', name: '挂号', sort: 2, isDefault: true },
        { id: 'sub_checkup', name: '体检', sort: 3, isDefault: true },
        { id: 'sub_dental', name: '牙科', sort: 4, isDefault: true }
      ]
    },
    {
      id: 'cat_education',
      name: '教育',
      icon: '📚',
      sort: 7,
      isDefault: true,
      subCategories: [
        { id: 'sub_books', name: '书籍', sort: 1, isDefault: true },
        { id: 'sub_course', name: '课程', sort: 2, isDefault: true },
        { id: 'sub_training', name: '培训', sort: 3, isDefault: true }
      ]
    },
    {
      id: 'cat_communication',
      name: '通讯',
      icon: '📱',
      sort: 8,
      isDefault: true,
      subCategories: [
        { id: 'sub_phone', name: '话费', sort: 1, isDefault: true },
        { id: 'sub_internet', name: '宽带', sort: 2, isDefault: true }
      ]
    },
    {
      id: 'cat_social',
      name: '人情',
      icon: '🎁',
      sort: 9,
      isDefault: true,
      subCategories: [
        { id: 'sub_redpacket', name: '红包', sort: 1, isDefault: true },
        { id: 'sub_gift', name: '礼物', sort: 2, isDefault: true },
        { id: 'sub_treat', name: '请客', sort: 3, isDefault: true }
      ]
    },
    {
      id: 'cat_other',
      name: '其他',
      icon: '📦',
      sort: 10,
      isDefault: true,
      subCategories: [
        { id: 'sub_misc', name: '杂项', sort: 1, isDefault: true },
        { id: 'sub_uncategorized', name: '未分类', sort: 2, isDefault: true }
      ]
    }
  ],
  income: [
    { id: 'cat_salary', name: '工资', icon: '💼', sort: 1, isDefault: true, subCategories: [] },
    { id: 'cat_parttime', name: '兼职', icon: '🧑‍💻', sort: 2, isDefault: true, subCategories: [] },
    { id: 'cat_invest', name: '理财', icon: '💹', sort: 3, isDefault: true, subCategories: [] },
    { id: 'cat_gift_income', name: '礼金', icon: '🎁', sort: 4, isDefault: true, subCategories: [] },
    { id: 'cat_other_income', name: '其他', icon: '✨', sort: 5, isDefault: true, subCategories: [] }
  ]
}

module.exports = {
  STORAGE_KEYS,
  DATA_VERSION,
  DEFAULT_CATEGORIES
}
