# 星派科技 CAE · SiPESC.PRE

React + TypeScript + Vite 桌面交互原型。首轮实现位于 [`prototype/`](prototype/README.md)，用于界面视觉和代表性操作流程评审。

```bash
cd prototype
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

打开本地 http://127.0.0.1:5173 。运行与检查命令、演示步骤及能力边界见原型 README。

- [开发约定](AGENTS.md)
- [项目开发策划](项目开发策划.md)：2026-10-21 的规划基线，保留原文。
- [来源映射](prototype/docs/source-map.md)
- [原型假设](prototype/docs/assumptions.md)
- [图标状态](prototype/docs/icon-manifest.md)

原型数据仅在会话内有效。支架及其显示网格由程序生成，未连接真实 FEM 数据、求解器或后端。专业图标仍待准确清单与评审。

当前上传范围为 v0.2 原型源码、依赖锁文件、测试与必要项目文档。本地会议资料、转写、分析证据和浏览器截图位于 `outputs/`，不纳入代码仓库；`node_modules/` 与 `dist/` 也不上传。
