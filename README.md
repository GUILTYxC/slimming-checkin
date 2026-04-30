# <img src="icon/icon.png" width="40" align="center" /> Slimming-DS

> 减重追踪桌面应用 — 计划、打卡、复盘，一目了然。

基于 Electron + React 构建的离线减重管理工具，支持多期计划、每日打卡、周度总结与数据统计。

---

## ✨ 功能

- **多期减重计划** — 自定义天数、初始体重、目标体重，自动推算每周减重目标
- **每日打卡** — 记录当日体重、运动消耗，勾选每日活动完成情况；支持补打卡
- **智能首页** — 当天未打卡自动进入打卡页，已打卡则显示仪表盘
- **活动统计** — 实时统计每项活动的完成率，全周期累计
- **周总结** — 每周复盘，记录心得与下周计划
- **体重趋势图** — 折线图展示体重变化，自动对比目标线
- **无边框窗口** — 自定义标题栏，简洁现代

---

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Electron 31 |
| 渲染 | React 18 + Vite 5 |
| 路由 | React Router 6 (Hash) |
| 数据库 | Dexie.js (IndexedDB) |
| 图表 | Recharts |
| 样式 | Tailwind CSS 3 |

---

## 🚀 启动

```bash
# 安装依赖
pnpm install

# 开发模式（启动 Electron 窗口）
pnpm run dev

# 生产构建
pnpm run build
```

---

## 📁 项目结构

```
slimming-ds/
├── electron/
│   ├── main.js              # Electron 主进程（无边框窗口、IPC）
│   └── preload.js           # 预加载脚本（窗口控制 API）
├── src/
│   ├── main.jsx             # React 入口
│   ├── App.jsx              # 路由配置
│   ├── index.css            # Tailwind + 全局样式
│   ├── db/
│   │   └── database.js      # Dexie.js 数据库 CRUD
│   ├── utils/
│   │   └── calculations.js  # 体重差、进度、周计算
│   ├── components/
│   │   ├── Layout.jsx       # 侧边栏 + 内容区布局
│   │   ├── TitleBar.jsx     # 自定义标题栏
│   │   ├── ProgressBar.jsx  # 进度条
│   │   ├── ActivityStats.jsx# 活动统计
│   │   ├── WeightChart.jsx  # 体重趋势图
│   │   └── WeekProgress.jsx # 每周进展列表
│   └── views/
│       ├── Home.jsx         # 智能首页
│       ├── PeriodList.jsx   # 减重计划列表
│       ├── PeriodForm.jsx   # 创建减重计划
│       ├── Dashboard.jsx    # 仪表盘
│       ├── DailyEntry.jsx   # 每日打卡
│       ├── WeeklySummary.jsx# 周总结
│       └── Statistics.jsx   # 数据统计
├── icon/
│   └── icon.png             # 应用图标
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 📖 使用指南

### 创建减重计划
在首页点击「+ 新建计划」，填写名称、天数、初始体重、目标体重，并添加每日活动（如跑步、力量训练等）。系统自动计算每周减重目标。

### 每日打卡
打开应用自动进入当天打卡页。填写当日体重、运动消耗卡路里，勾选完成的活动。页面自动显示与昨日、与期初的体重差。

### 查看进度
侧边栏进入仪表盘查看：整体进度、体重趋势图、每周目标达成、活动完成率。

### 周总结
每周结束后在「周总结」页写下本周心得。系统自动统计本周实际减重 vs 计划减重。

### 数据统计
「统计」页提供：体重变化趋势、活动完成率对比、每周数据表格。

---

## 📝 数据存储

所有数据存储在浏览器 IndexedDB 中，通过 Dexie.js 操作。数据库名为 `SlimmingDB`，包含 4 张表：

| 表 | 说明 |
|---|---|
| `periods` | 减重期 |
| `dailyActivities` | 每日活动模板 |
| `dayRecords` | 每日打卡记录 |
| `weeklySummaries` | 周总结 |

---

## 📄 License

MIT
