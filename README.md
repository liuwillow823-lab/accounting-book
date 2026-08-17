# 日常记账本（微信小程序）

一款个人记账微信小程序：记录收入与支出，支持明细、年度账单报表、统计图表分析，并支持微信登录与云端同步（换手机账本不丢）。

## 功能特性

- **记账**（首页）：今日收入 / 支出概览，一键记一笔
- **明细**：账单按日分组展示，支持编辑、删除
- **账单**：按年查看 1~12 月收支汇总报表（收入 / 支出 / 汇总）
- **图表**：周 / 月 / 年走势折线图 + 分类占比环形图，支出大类可下钻查看小类
- **我的**：微信一键登录（openid），可自定义头像、昵称
- **云同步**：登录后账单自动备份到云端，多设备 / 换手机登录即可恢复历史账本；老用户本地数据登录后自动迁移

## 目录结构

```
Accounting Book/
├── app.js / app.json / app.wxss     # 小程序入口与全局配置
├── cloudfunctions/                  # 云函数
│   ├── login/                       # 登录：获取 openid
│   ├── syncPush/                    # 上传待同步账单到云端
│   └── syncPull/                    # 拉取该用户云端账单
├── models/                          # 数据层（分类、账单 CRUD、软删除）
├── utils/                           # 工具（存储、日期、金额、云同步）
├── components/category-picker/      # 分类两级选择器
├── pages/
│   ├── index/                       # 首页：今日概览 + 记一笔入口
│   ├── add/                         # 记一笔 / 编辑
│   ├── list/                        # 明细：按日分组账单列表
│   ├── report/                      # 账单：年度收支月汇总表
│   ├── statistics/                  # 图表：走势图 + 分类占比
│   ├── profile/                     # 我的：登录 / 头像昵称
│   └── category/                    # 分类管理
└── assets/icons/                    # TabBar 图标
```

## 如何运行

### 1. 准备

- 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册微信小程序账号，获取正式 AppID
- 在 [微信公众平台](https://mp.weixin.qq.com/) 开通「云开发」，创建云环境

### 2. 导入项目

1. 开发者工具 → **导入项目**
2. 目录选择本文件夹：`Accounting Book`
3. AppID 填入你的正式 AppID

### 3. 配置云开发

1. 顶部工具栏点「云开发」，确认环境已关联
2. 数据库 → 新建集合：`transactions`
3. 若创建了多个云环境，将环境 ID 填入 `app.js` 的 `wx.cloud.init`

### 4. 部署云函数

分别右键以下目录 → 「创建并部署：云端安装依赖（不上传 node_modules）」：

- `cloudfunctions/login`
- `cloudfunctions/syncPush`
- `cloudfunctions/syncPull`

### 5. 编译运行

点击「编译」即可在模拟器中预览。

## 数据存储

### 本地（未登录时）

| 数据 | Storage Key |
|---|---|
| 分类 | `expense_categories` |
| 账单 | `expense_transactions` |

可在开发者工具 → Storage 面板查看和调试。

### 云端（登录后）

- 数据库集合：`transactions`
- 每条记录通过 `ownerId` 关联用户 openid
- 同步策略：本地优先，按 `updatedAt` 合并（较新的赢）；删除为软删除（`deleted` 标记），支持多端同步删除

## 隐私说明

- 本小程序通过 `wx.login` 获取 openid 用于识别登录账号
- 头像、昵称由用户主动设置（微信官方 `chooseAvatar` / `nickname` 组件）
- 正式发布前请在公众平台「用户隐私保护指引」中声明：登录、用户主动提供的头像昵称
- 账单数据在用户授权登录后同步到微信云开发数据库

## 审核提示

- 版本管理中测试账号选择「需登录账号才可使用」，并在审核说明中写明登录方式
- 主要功能页面路径：`pages/index/index`（记账）、`pages/list/list`（明细）、`pages/report/report`（账单）、`pages/statistics/statistics`（图表）、`pages/profile/profile`（我的）
