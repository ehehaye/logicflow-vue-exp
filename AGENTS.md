# AGENTS.md

> LogicFlow · Vue 2 Demo — 基于 Vue 2.7 + LogicFlow + Vite 的流程编辑器示例。面向用户的说明见 `README.md`。

## Project

- 单页 Vue 2.7 应用，Options API，纯 JavaScript（无 TypeScript）。
- 流程引擎 LogicFlow 2.x；构建工具 Vite 7；包管理器 pnpm；样式 Tailwind（`@tailwindcss/postcss7-compat`，类名前缀 `tw-`）。
- 入口链路：`index.html` → `src/main.js` → `src/App.vue`。
- Node >= 20.19（`.nvmrc` 为 v24.16.0）。
- 暂无测试框架。

## Commands

- `pnpm install` — 安装依赖（`node_modules/` 不入库，首次必跑）
- `pnpm dev` — 启动 Vite 开发服务器（默认 <http://localhost:5173）>

## Architecture

- `src/main.js` — 挂载 Vue 根实例，导入 `src/styles.css`。

## Conventions

- UI 文案为中文，改动时保持一致。

## Information about LogicFlow
<!-- BEGIN:logicflow-agent-rules -->
# LogicFlow Agent Rules

LogicFlow documentation is available at:

- `node_modules/@logicflow/core/dist/docs/`

Package roles:

- `@logicflow/core`: core graph editor runtime, including canvas, nodes, edges, models, events, rendering, themes, and basic interactions.
- `@logicflow/extension`: official plugins for common product features.
- `@logicflow/layout`: official layout plugins for automatic graph layout.

The docs for `@logicflow/extension` and `@logicflow/layout` are included under:

- `node_modules/@logicflow/core/dist/docs/tutorial/extension/`

Before implementing any LogicFlow feature, check the local docs first to see whether LogicFlow already provides a built-in, extension, or layout capability. If it does, prefer the documented official capability instead of reimplementing it from scratch.

If an official package is needed but not installed, ask the user before installing it.
<!-- END:logicflow-agent-rules -->

## Notes

- （待补充）
