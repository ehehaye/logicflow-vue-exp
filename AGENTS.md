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
- `pnpm dev` — 启动 Vite 开发服务器（默认 http://localhost:5173）
- `pnpm build` — 生产构建到 `dist/`
- `pnpm preview` — 预览构建产物
- `pnpm format` / `pnpm format:check` — Prettier 格式化 / 检查（配置见 `.prettierrc.json`）

## Architecture

- `src/main.js` — 挂载 Vue 根实例，导入 `src/styles.css`。
- `src/App.vue` — 顶层布局与状态（`flowReadonly`、`jsonVisible`、`graphJson`）；`mounted` 时把 `window.flowDemo`（`createNode` / `deleteSelectedNode` / `clearCanvas` / `toggleEditable`）暴露到浏览器控制台。
- `src/components/FlowCanvas.vue` — 核心组件：`mounted` 中创建 LogicFlow 实例、工具栏、节点增删改与自动连线/删除桥接、只读模式、`sidebar` 作用域插槽，向父级 emit 事件。只读下节点不可拖动，是否可选中由 `readonlySelectable`（默认 `true`）控制。
- `src/components/EditorSidebar.vue` — 侧边栏，编辑选中节点名称（经插槽回调，仅展示与触发）。
- `src/components/JsonDialog.vue` — 导出结果的 JSON 弹窗（`v-if="visible"`）。
- `src/styles.css` — Tailwind 指令 + LogicFlow 命令式生成 DOM 的样式覆盖（`.lf-*`、`.flow-canvas--*`）。
- 配置：`vite.config.js`（别名 `@` → `src`）、`tailwind.config.js`（`tw-` 前缀 + 自定义 `grid-cols-flow-editor` / `min-h-flow-panel` / `shadow-button|panel|dialog`）、`postcss.config.js`、`.prettierrc.json`（格式化）、`.prettierignore`。

## Conventions

- SFC 使用 Options API，组件写 `name`，用 `defineComponent` 包裹组件定义，自定义事件在 `emits` 中显式声明。
- 组件间自定义事件为 kebab-case：`node-add`、`node-delete`、`canvas-clear`、`selection-change`、`update-label`、`export`、`update:readonly`——不要擅自改名（会破坏父子组件约定）。
- SFC 块顺序：`<template>` 排在 `<script>` 之前。
- 样式一律用带 `tw-` 前缀的 Tailwind 工具类写在内联 `class`；LogicFlow 命令式注入的 DOM 无法用工具类，改在 `src/styles.css` 覆盖。
- 代码风格由 Prettier 统一（配置见 `.prettierrc.json`：有分号、单引号、2 空格、LF）；VSCode 保存时走 Prettier 自动格式化。
- 节点删除统一走工具栏逻辑（删除后自动桥接上下游）；键盘删除已禁用（`keyboard.enabled: false`）。
- UI 文案为中文，改动时保持一致。

## Notes

- （待补充）
