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

## 发布与自动部署

线上地址：<https://silicon-note.netlify.app> ｜ 源码仓库：<https://github.com/111ad-creater/silicon-note>

**一键发布**（唯一上线入口）：双击桌面「发布站点」快捷方式，或在项目目录运行

```powershell
.\publish.cmd "这次改了什么"
```

脚本依次执行：统计本月发布次数 → 检查改动 → `npm run build` → `git add -A` + `git commit` → `git push`。
构建失败会自动中止，线上保持上一个正常版本；没有改动时不会产生空提交。

**为什么要手动发布**：每次 push 到 `main` 都会触发一次 Netlify 生产部署，消耗 15 信用点
（免费额度 300 点/月，耗尽即停站）。本地 `post-commit` 自动推送钩子已停用，现在的节奏是
「本地随便改、随便 commit → 想上线时点一次发布」。

```text
git commit（本地攒着） → 点发布 → push → GitHub Actions 构建 → Netlify 生产部署（15 点）
```

脚本会把每次发布记到 `.publish-log.txt`（已 gitignore），本月超过 10 次会要求二次确认。
部署进度：<https://github.com/111ad-creater/silicon-note/actions>

> 想恢复自动推送：把 `.git/hooks/post-commit.disabled` 改回 `post-commit` 即可。不建议——
> 那等于每次 commit 都烧 15 点。
