# SiliconNote Project Guidelines

You are working inside the **SiliconNote（AI 芯片与系统直觉图鉴）** project.

## Project Context & Aesthetic
- **Target Audience**: IC/EE undergraduates and AI systems beginners.
- **Writing Style**: Plain Chinese (大白话), everyday analogies (生活类比如“大脑 Tensor Core / 书桌 SRAM / 大书柜 HBM / 便利贴 PagedAttention”), and first-principles back-of-the-envelope math (算账直觉). Avoid dry textbook walls of equations or Verilog.
- **Visual System**: Vercel / Linear minimalist geek aesthetic, dark mode default (`#060A13` / `#0B1120`) with light mode toggle, Cyber Blue (`#38BDF8`) and Chip Green (`#10B981`) accents, monospace font for metrics and specs.

## Key Files
- `src/data/curriculum.js`: 5 stages × 3 lessons (15 total). Supported block types inside `blocks`: `heading`, `paragraph`, `callout` (`variant`: `analogy` | `formula` | `warning` | `tip`), `table`, `flowchart`.
- `src/data/benchmarks.js`: Benchmark blog entries with interactive `nvidiaSmiModes` and `chartData` (`hfTtft`, `vllmTtft`, `hfTpot`, `vllmTpot`, `hfTps`, `vllmTps`).
- `src/data/glossary.js`: Terms with `term`, `fullName`, `category` (`芯片硬件` | `存储带宽` | `推理系统` | `性能指标`), `plainDesc`, `analogy`, `spec`.
- `src/pages/LabPage.jsx`: Interactive KV Cache & Memory Bandwidth Simulator (`80GB HBM`, `16GB` 8B-FP16 weights, MHA/GQA/DeepSeek MLA).

## Environment & Build Workflow
- **Project Root**: `D:\Projects\silicon-note`
- **Origin Conversation**: Created and migrated in conversation `4e76b723-dfb3-4b4d-bac1-6ac3d1d6a3bf` ([原搭建对话](conversation://4e76b723-dfb3-4b4d-bac1-6ac3d1d6a3bf)).
- **Node/Vite**: This machine runs Node v16 (`vite@^4.5.3`, `tailwindcss@^3.4.3`). Keep dependencies Node 16 compatible.
- **Important**: The user launches this site via `Desktop\SiliconNote.lnk` -> `D:\Projects\silicon-note\start-silicon-note.bat` -> `vite preview` (which serves `dist/`). Whenever you edit files under `src/`, always run `npm run build` afterwards so the desktop shortcut reflects the latest changes!
