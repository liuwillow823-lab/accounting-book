# 日常记账本（微信小程序）

本地记账小程序，数据保存在手机本地，无需登录。

## 如何运行

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开开发者工具 → **导入项目**
3. 目录选择本文件夹：`Accounting Book`
4. AppID 选 **测试号** 或 **touristappid**（体验阶段即可）
5. 点击「编译」即可在模拟器里预览

## 当前进度（阶段 1）

- [x] 项目骨架与 TabBar（记账 / 账单 / 统计）
- [x] 本地存储与默认 10 大类分类
- [x] 记一笔（金额、日期、分类、备注）
- [x] 账单列表（按日分组）
- [x] 编辑 / 删除账单
- [ ] 分类管理（阶段 2）
- [ ] 统计图表（阶段 3）

## 目录说明

```
Accounting Book/
├── app.js / app.json / app.wxss   # 小程序入口
├── models/                         # 数据层（分类、账单 CRUD）
├── utils/                          # 工具（存储、日期、金额）
├── components/category-picker/     # 分类两级选择器
├── pages/
│   ├── index/                      # 首页：今日概览
│   ├── add/                        # 记一笔 / 编辑
│   ├── list/                       # 全部账单
│   └── statistics/                 # 统计（占位）
└── assets/icons/                   # TabBar 图标（占位，可替换）
```

## 数据存储

- 分类：`expense_categories`
- 账单：`expense_transactions`
- 可在开发者工具 → **Storage** 面板查看和调试

## 产品细节说明

详见项目内各页面注释，或询问开发者继续阶段 2。
