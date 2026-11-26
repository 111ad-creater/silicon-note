# SiliconNote · AI 芯片与系统直觉图鉴

面向集成电路本科生与 AI 系统初学者的现代极客风知识库与交互式学习网站。用大白话、生活类比、算账直觉与交互模拟器拆解 GPU/TPU 架构与大模型推理瓶颈。

## 目录结构

```text
silicon-note/
├── src/
│   ├── components/
│   │   └── Navbar.jsx          # 顶部导航栏与深浅色主题切换
│   ├── pages/
│   │   ├── HomePage.jsx        # 首页 Hero 与 5 阶段学习路线进度网格
│   │   ├── DocsPage.jsx        # 左侧 15 讲可折叠目录 + 右侧富文本阅读器
│   │   ├── LabPage.jsx         # KV Cache 与显存带宽模拟器
│   │   ├── BenchmarksPage.jsx  # 实测日记、nvidia-smi 模拟面板与 TTFT/TPOT 图表
│   │   └── GlossaryPage.jsx    # 带实时搜索与分类过滤的术语词典
│   ├── data/
│   │   ├── curriculum.js       # 5 阶段 × 3 课共 15 讲课程数据
│   │   ├── benchmarks.js       # 压测日记数据与监控指标
│   │   └── glossary.js         # 高频术语词典数据
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── GEMINI.md                   # Antigravity 项目级上下文与内容创作规范
├── silicon-note.ico            # 桌面快捷方式多分辨率图标
├── start-silicon-note.bat      # 一键后台静默启动并打开浏览器
├── start-silent.vbs            # 无黑框启动 vite preview
├── stop-silicon-note.bat       # 停止 5173 端口后台服务
├── enable-autostart.bat        # 注册 Windows 开机静默自启
└── disable-autostart.bat       # 取消开机自启
```

## 常用命令

```powershell
# 开发调试
npm run dev

# 生产构建（修改 src/ 后执行，桌面快捷方式才会加载最新页面）
npm run build

# 预览生产产物
npm run preview
```

## 扩展网站内容指南

- **新增或修改课程**：编辑 `src/data/curriculum.js`，支持 `heading`、`paragraph`、`callout`（`analogy` / `formula` / `warning` / `tip`）、`table` 与 `flowchart` 块级结构。
- **新增实测日记**：在 `src/data/benchmarks.js` 中追加对象，配齐 `nvidiaSmiModes` 与 `chartData`。
- **新增术语词条**：在 `src/data/glossary.js` 的 `GLOSSARY_TERMS` 中添加，包含英文全称、一句话大白话、生活类比与硬件规格。
