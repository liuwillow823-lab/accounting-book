const categoryModel = require('../../models/category')

Component({
  properties: {
    categoryId: { type: String, value: '' },
    subCategoryId: { type: String, value: '' },
    type: { type: String, value: 'expense' }
  },

  data: {
    visible: false,
    categories: [],
    activeCategoryId: '',
    activeSubCategories: [],
    selectedLabel: '',
    selectedIcon: '📦'
  },

  lifetimes: {
    attached() {
      this.loadCategories()
    }
  },

  observers: {
    'categoryId, subCategoryId': function () {
      this.loadCategories()
      this.updateSelectedDisplay()
    }
  },

  methods: {
    loadCategories() {
      const categories = categoryModel.getCategoryTree(this.properties.type)
      const currentId = this.properties.categoryId || (categories[0] && categories[0].id) || ''
      const activeCat = categories.find(c => c.id === currentId) || categories[0] || null
      const hasSelected = !!categories.find(c => c.id === this.properties.categoryId) && !!categoryModel.findSubCategory(this.properties.categoryId, this.properties.subCategoryId, this.properties.type)
      const activeSubCategories = this.properties.type === 'income'
        ? []
        : (activeCat ? activeCat.subCategories : [])
      this.setData({
        categories,
        activeCategoryId: currentId,
        activeSubCategories
      })
      if (this.properties.type === 'expense' && !hasSelected && categories[0] && categories[0].subCategories[0]) {
        this.triggerEvent('change', {
          categoryId: categories[0].id,
          subCategoryId: categories[0].subCategories[0].id,
          categoryName: categories[0].name,
          subCategoryName: categories[0].subCategories[0].name,
          categoryIcon: categories[0].icon
        })
      }
      if (this.properties.type === 'income' && !this.properties.categoryId && categories[0]) {
        this.triggerEvent('change', {
          categoryId: '',
          subCategoryId: '',
          categoryName: '',
          subCategoryName: '',
          categoryIcon: ''
        })
      }
    },

    updateSelectedDisplay() {
      const { categoryId, subCategoryId } = this.properties
      const cat = categoryModel.findCategory(categoryId, this.properties.type)
      if (!cat) {
        this.setData({ selectedLabel: '', selectedIcon: '📦' })
        return
      }
      if (this.properties.type === 'income') {
        this.setData({
          selectedLabel: cat.name,
          selectedIcon: cat.icon
        })
        return
      }
      const sub = categoryModel.findSubCategory(categoryId, subCategoryId, this.properties.type)
      if (sub) {
        this.setData({
          selectedLabel: `${cat.name} · ${sub.name}`,
          selectedIcon: cat.icon
        })
      }
    },

    onOpen() {
      const { categoryId } = this.properties
      const categories = this.data.categories
      const activeId = categoryId || (categories[0] && categories[0].id) || ''
      const activeCat = categories.find(c => c.id === activeId)
      this.setData({
        visible: true,
        activeCategoryId: activeId,
        activeSubCategories: activeCat ? activeCat.subCategories : []
      })
    },

    onClose() {
      this.setData({ visible: false })
    },

    preventMove() {},

    onSelectCategory(e) {
      const id = e.currentTarget.dataset.id
      const cat = this.data.categories.find(c => c.id === id)
      if (!cat) return

      if (this.properties.type === 'income') {
        this.setData({ visible: false })
        this.triggerEvent('change', {
          categoryId: cat.id,
          subCategoryId: '',
          categoryName: cat.name,
          subCategoryName: '',
          categoryIcon: cat.icon
        })
        return
      }

      this.setData({
        activeCategoryId: id,
        activeSubCategories: cat.subCategories
      })
    },

    onSelectSub(e) {
      const { categoryId, subId } = e.currentTarget.dataset
      const cat = categoryModel.findCategory(categoryId, this.properties.type)
      const sub = categoryModel.findSubCategory(categoryId, subId, this.properties.type)
      if (!cat || !sub) return

      this.setData({ visible: false })
      this.triggerEvent('change', {
        categoryId,
        subCategoryId: subId,
        categoryName: cat.name,
        subCategoryName: sub.name,
        categoryIcon: cat.icon
      })
    }
  }
})
