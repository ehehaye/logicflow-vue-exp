# AGENTS.md

> LogicFlow Vue Exp — 基于 Vue 2.7 + LogicFlow + Vite 的实践经验示例集（当前含 Pipeline 流水线编排示例）；纯 JS + Options API，可低成本迁移 Vue 3。面向用户的说明见 `README.md`。

## Project

- 单页 Vue 2.7 应用，Options API + `defineComponent`，纯 JavaScript（无 TypeScript）。
- 技术栈：LogicFlow 2.x（`@logicflow/core` + `@logicflow/layout` 的 Dagre 布局 + `@logicflow/extension` 的 Control 画布控件）、Vite 7、pnpm、Element UI 2.x、Tailwind（`@tailwindcss/postcss7-compat`，JIT，类名前缀 `tw-`）、highlight.js（`lib/common` + `atom-one-dark` 主题）、lodash（`cloneDeep` / `isEqual` / `differenceWith` / `debounce`）。
- 入口链路：`index.html` → `src/main.js`（`Vue.use(ElementUI)`，导入 element-ui 主题 css 与 `src/styles.css`）→ `src/App.vue`（画布类型选择器，动态渲染视图）→ `src/views/reactive.vue`（数据驱动，默认）/ `src/views/classic.vue`（事件驱动）。
- 路径别名 `@/` → `src/`（`vite.config.js` 与 `jsconfig.json` 均配置）。
- Node >= 20.19、pnpm >= 9（`package.json` engines）；`.nvmrc` 为 v24.16.0。
- 暂无测试框架。

## Commands

- `pnpm install` — 安装依赖（`node_modules/` 不入库，首次必跑）
- `pnpm dev` — 启动 Vite 开发服务器（默认 <http://localhost:5173>）
- `pnpm build` — 生产构建（输出 `dist/`）
- `pnpm preview` — 预览构建产物
- `pnpm format` / `pnpm format:check` — Prettier 格式化 / 校验

## Architecture

- `src/main.js` — 应用入口：`Vue.use(ElementUI)`，导入 `element-ui/lib/theme-chalk/index.css` 与 `src/styles.css`，挂载根实例。
- `src/App.vue` — 根组件：分段切换器（`.view-switch` 滑块控件）切换「数据驱动 / 事件驱动」，`.app-content` 撑满剩余高度，经 `<Component :is="activeView" />` 动态渲染 `views/reactive.vue`（默认）或 `views/classic.vue`。
- `src/views/reactive.vue` — 数据驱动视图：组合 `LogicFlow` + `PipelineReactive`，持有 `nodes`（`:nodes.sync`）与 `activeIndex`；侧栏 `el-input` 直接编辑选中节点的 `text`（`computed node` 取 `nodes[activeIndex]`），并通过 `CodePreviewer` 展示 `nodes` JSON。
- `src/views/classic.vue` — 事件驱动视图：组合 `LogicFlow`（`:graphData.sync`）+ `PipelineClassic`，侧栏通过 `CodePreviewer` 展示画布维护的 `graphData` JSON。
- `src/components/common/CodePreviewer.vue` — 只读代码预览组件（props：`code` / `language` / `showLineNumbers` / `title` / `maxHeight`）：highlight.js `lib/common` 语法高亮（指定语言未注册时降级自动检测），行号 gutter 横向滚动 `sticky` 吸附，标题栏 + 语言标签 + 一键复制（`navigator.clipboard`，非安全上下文回退 `execCommand`），代码区由 `el-scrollbar` 承载、限高通过 CSS 变量下发给内部 wrap。
- `src/components/lf/LogicFlow.vue` — 通用 LogicFlow 封装（props：`options` / `graphData` / `teleport`；emit `update:graphData`）。`mounted` 创建带 Dagre + Control 插件的实例并 `registerNodes`/`registerEdges`；`setupPlugins` 在 `render` 前移除 Control 的 undo/redo/reset 并新增「适应」（调用 `lf.fitView`）；随后在 `once('graph:rendered')` 回调中注册 `setupAutoLayout` / `ResizeObserver` / `setupWatchers` / `setupGraphDataEvents` 并置 `initialized=true`，最后 `render`，确保容器就绪。默认配置关闭编辑态交互（只读浏览）；`setupAutoLayout` 包装 `fitView` 先跑 `lf.extension.dagre.layout` 再适配并恢复选中；`ResizeObserver` 监听容器变化重适配；`setupGraphDataEvents` 监听 `GRAPH_DATA_UPDATE` / `node:properties-change` 向外 `_.cloneDeep` 同步 `graphData`；`setupWatchers` 经 `_.isEqual` 防循环后 `render` 并同步 `options`。slot 内容包在 `LogicFlowContext` 中向下游注入。
- `src/components/lf/LogicFlowContext.vue` — 透传 `lf` prop，`provide` 暴露 `lf` / `graphModel` / `injectLf` / `injectGraphModel` 供场景组件 `inject`。
- `src/components/lf/model.js` — `LogicFlowPro`（导出名 `LogicFlow`）继承 `@logicflow/core`：构造时对 `graphModel` 做 `reactive`，新增 `getLastNode()` 取无出边的末节点。
- `src/components/lf/events.js` — `CenterEvents.GRAPH_DATA_UPDATE` 事件常量：场景组件经 `graphModel.eventCenter` 冒泡图数据变更。
- `src/components/lf/nodes/` — 自定义节点 `step-node`（`StepNode.js`：`StepNodeModel extends RectNodeModel` 圆角 8px，选中时填充 `#2563eb`、白字，悬停描边高亮；`StepNodeView extends RectNode`；导出 `STEP_NODE_TYPE`）与注册入口 `index.js`（`registerNodes`）。
- `src/components/lf/edges/` — 自定义边 `step-edge`（`StepEdge.js`：`StepEdgeModel extends PolylineEdgeModel`，`isHitable=false` 仅作连线展示；导出 `STEP_EDGE_TYPE`）与注册入口 `index.js`（`registerEdges`）。
- `src/components/lf/scenes/PipelineClassic.vue` — 事件驱动场景：工具栏（新增 / 清空画布 / 删除节点；「适应」已移至 Control 控件）+ 节点 CRUD（追加 / 前插 / 后插；`rewireIncomingEdges`/`rewireOutgoingEdges`/`shiftSubtree` 腾位重连；`deleteSelectedNode` 交叉桥接上下游；`clearCanvas`；`connectNodes` 防重连）。`inject` `injectLf`/`injectGraphModel`；emit `select` / `node-add` / `node-delete` / `canvas-clear`，并经 `eventCenter` 冒泡 `GRAPH_DATA_UPDATE`；导出常量 `DEFAULT_X` / `DEFAULT_Y` / `VERTICAL_GAP` / `NODE_TYPE` / `EDGE_TYPE`。
- `src/components/lf/scenes/PipelineReactive.vue` — 数据驱动场景（无独立模板，复用 Classic 工具栏）：`mixins: [PipelineClassic]`（复用工具栏与选中逻辑），新增 props `nodes`（`.sync`）与 `nodeFactory`；`watch nodes`（deep）区分属性变更（`syncNodeProperties` 批量 `updateText`/`setProperties` 增量更新）与数量变更（全量 `render`）；`toGraphData` 按索引补 id/type/坐标并串联 `step-edge`、透传 `properties`；`nodeIdMap`（WeakMap）维护原始数据到图节点 id 的映射；`previousNodes` 存上轮快照供 diff；`createNode`/`deleteSelectedNode`/`clearCanvas` 均 emit `update:nodes` 同步业务数据（不直接改 props）。
- `src/utils/index.js` — `uuid()` 生成随机 id。

## Conventions

- 全部组件用 Options API + `defineComponent`，纯 JS；`emits` 显式声明事件；跨层数据用 `provide/inject`（场景组件 `inject` `injectLf`/`injectGraphModel`）。
- 同一份流水线能力有两条路径：`PipelineClassic`（事件驱动，直面 LogicFlow 底层数据）与 `PipelineReactive`（数据驱动，mixin 复用 Classic 的工具栏）。改公共 CRUD 逻辑优先改 `PipelineClassic`，勿破坏 Reactive 的 mixin 复用。
- UI 文案为中文，改动时保持一致。
- Tailwind 类名一律带 `tw-` 前缀；LogicFlow 以命令式注入 DOM，无法用 `tw-`。节点/边的视觉样式（配色、选中/悬停态）在各自 model 类内通过 `getNodeStyle`/`getTextStyle`/`getEdgeStyle` 定义（配色常量集中于 `StepNode.js` 的 `NODE_COLORS`）；应用外壳 / 工具栏 / 侧栏等业务 UI 样式在 `src/styles.css` 的 `@layer components` 用 `.app-*` / `.view-switch` / `.pipeline-toolbar` / `.inspector` 定义，Element UI 经 `.el-*` 覆盖美化；`CodePreviewer` 外壳样式（`.code-previewer__*`）与其 highlight.js `atom-one-dark` 主题在组件内非 scoped 引入。
- 侧栏展示 JSON 统一用 `CodePreviewer`（`language="json"`），不要另写 `pre` / `code` 渲染。
- 代码风格：2 空格缩进（`.editorconfig`）、Prettier（`singleQuote`、`semi`、`printWidth 120`、`trailingComma all`）。
- 新增节点统一走 Pipeline 场景组件（`createNode` 等），不要在别处直接调 `lf.addNode`。
- 自定义节点/边在 `nodes/`、`edges/` 定义，并在各自 `index.js` 数组中追加注册，由 `LogicFlow.vue` 统一 `register`。

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

- README 已与当前实现同步（`App.vue` 双模式切换 + `LogicFlow.vue`（Dagre / Control）+ `scenes/PipelineClassic.vue` / `PipelineReactive.vue` + `CodePreviewer` 双视图侧栏 JSON）；若改动功能请同步更新 README 与 `docs/` 截图。
- 本地根目录存在 `.pnpm-store/`（已在 `.gitignore` 忽略），属 pnpm 本地缓存，非项目源文件。
