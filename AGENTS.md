# AGENTS.md

> LogicFlow · Vue 2 Demo — 基于 Vue 2.7 + LogicFlow + Vite 的流程（流水线）编辑器示例。面向用户的说明见 `README.md`（注意：README 的部分组件 API 描述已过时，以源码为准）。

## Project

- 单页 Vue 2.7 应用，Options API + `defineComponent`，纯 JavaScript（无 TypeScript）。
- 技术栈：LogicFlow 2.x（`@logicflow/core` + `@logicflow/layout` 的 Dagre 布局）、Vite 7、pnpm、Element UI 2.x、Tailwind（`@tailwindcss/postcss7-compat`，JIT，类名前缀 `tw-`）。
- 入口链路：`index.html` → `src/main.js`（`Vue.use(ElementUI)`，挂载 App）→ `src/App.vue` → `src/views/design/pipeline.vue`。
- 路径别名 `@/` → `src/`（`vite.config.js` 与 `jsconfig.json` 均配置）。
- Node >= 20.19、pnpm >= 9（`package.json` engines）；`.nvmrc` 为 v24.16.0。
- 暂无测试框架。

## Commands

- `pnpm install` — 安装依赖（`node_modules/` 不入库，首次必跑）
- `pnpm dev` — 启动 Vite 开发服务器（默认 <http://localhost:5173）>
- `pnpm build` — 生产构建（输出 `dist/`）
- `pnpm preview` — 预览构建产物
- `pnpm format` / `pnpm format:check` — Prettier 格式化 / 校验

## Architecture

- `src/main.js` — 应用入口：注册 ElementUI，导入 `src/styles.css`，挂载根实例。
- `src/App.vue` — 根组件，仅渲染页面视图 `views/design/pipeline.vue`。
- `src/views/design/pipeline.vue` — 页面视图：组合 `LogicFlow` + `Pipeline` + `NodeEditor`，持有初始图数据 `INITIAL_GRAPH_DATA` 与 `selectedNode` 状态，转发子组件事件。
- `src/components/lf/LogicFlow.vue` — 通用 LogicFlow 封装组件（props：`options` / `graphData` / `teleport`；emit `ready`）。创建带 Dagre 插件的实例，包装 `fitView` 先自动布局再适配，`ResizeObserver` 监听容器，`$watch` 同步 `graphData` 渲染与 `options` 编辑配置；默认配置关闭编辑态交互（只读浏览）。
- `src/components/lf/LoginFlowContext.vue` — 通过 `provide/inject` 向下游暴露 `lf` 与 `graphModel`。
- `src/components/lf/model.js` — `LogicFlowWithInterceptor` 继承 `@logicflow/core`：对 `graphModel` 做 `reactive`，新增 `getLastNode()` 取无出边的末节点。
- `src/components/lf/scenes/pipeline/index.vue` — `Pipeline` 场景组件：工具栏与节点 CRUD 逻辑（新增：追加 / 前插 / 后插；删除选中节点并交叉桥接上下游；清空画布；`connectNodes` / `updateNode`）。emit `select` / `node-add` / `node-delete` / `node-update` / `canvas-clear`。
- `src/views/design/modules/NodeEditor.vue` — 侧栏面板：编辑选中节点文本，emit `update`。

## Conventions

- 全部组件用 Options API + `defineComponent`，纯 JS；`emits` 显式声明事件；跨层数据用 `provide/inject`。
- UI 文案为中文，改动时保持一致。
- Tailwind 类名一律带 `tw-` 前缀；LogicFlow 以命令式注入 DOM，无法用 `tw-`，其样式统一在 `src/styles.css` 用 `.lf-*` 覆盖（配色、选中高亮等）。
- 代码风格：2 空格缩进（`.editorconfig`）、Prettier（`singleQuote`、`semi`、`printWidth 120`、`trailingComma all`）。
- 新增节点统一走 `Pipeline` 场景组件（`createNode` 等），不要在别处直接调 `lf.addNode`。

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

- README 的「组件 API（FlowCanvas / EditorSidebar）」与「只读/导出 JSON」等描述基于旧版实现，当前源码已重构为 `LogicFlow.vue` + `scenes/pipeline` + `NodeEditor`，以源码为准；若改动功能请同步更新 README。
- 本地根目录存在 `.pnpm-store/`（已在 `.gitignore` 忽略），属 pnpm 本地缓存，非项目源文件。
