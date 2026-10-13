# LogicFlow · Vue 2 Demo

基于 **Vue 2.7 + LogicFlow + Vite** 的流程编辑器示例。演示如何在 Vue 2 项目中集成 LogicFlow，实现节点的增删、拖拽、串联与流程图 JSON 导出。

## 功能

- 初始化「开始 → 处理订单」示例流程
- 新增节点并按顺序纵向串联，自动连线
- 选中并拖拽节点调整位置
- 删除节点时自动桥接其上下游节点
- 清空画布、适应画布、导出流程 JSON
- 连线只读：不可选中、不可编辑、不可调整
- 选中节点后不显示连接锚点，禁止手动创建连线（连线仅由工具栏自动生成）
- 编辑 / 只读模式切换：只读下节点不可拖动、变更类工具栏按钮禁用；是否可点击选中由 `readonlySelectable` 控制（默认允许），编辑态节点鼠标显示为 pointer
- 选中节点高亮：背景为蓝色、文字为白色
- 新增 / 删除节点后自动适应一次画布

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 2.7 |
| 流程引擎 | [LogicFlow](https://github.com/didi/LogicFlow) 2.x |
| 构建工具 | Vite 7 |
| 包管理器 | pnpm |

## 环境要求

- Node.js >= 20.19（或 >= 22.12，Vite 7 要求）
- pnpm

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 生产构建
pnpm build

# 预览构建产物
pnpm preview
```

开发服务器默认地址见终端输出（通常为 `http://localhost:5173`）。

## 目录结构

```
.
├── index.html          # HTML 入口
├── vite.config.js      # Vite 配置
├── package.json
├── pnpm-lock.yaml
├── src
│   ├── main.js         # 应用入口，挂载 Vue 实例
│   ├── App.vue         # 编辑器界面与 LogicFlow 集成逻辑
│   └── styles.css      # 全局样式
└── .vscode/            # 推荐的编辑器扩展
```

## 使用说明

1. 点击 **新增节点**：会在当前最后一个节点下方新增节点并自动连线。
2. 点击节点可选中并拖动；选中后不出现锚点，无法通过拖拽锚点手动创建连线；点击空白处取消选择。
3. 侧边栏 **当前选择** 输入框可直接编辑选中节点的名称。
4. 点击 **删除选中节点**：删除后会保留其上游到下游的连接关系。
5. 点击 **清空画布**：需先选中任意节点。
6. 点击 **适应画布**：自动缩放到内容范围。
7. 点击 **导出 JSON**：以弹窗展示当前画布的图数据。
8. 点击 **切换只读 / 切换编辑**：在编辑与只读模式间切换；只读时节点不可拖动（默认仍可点击选中，可用 `readonlySelectable` 关闭），新增、删除、清空按钮禁用。

此外，编辑器在 `mounted` 时会把常用方法挂到 `window.flowDemo`，便于在浏览器控制台或集成测试中调用：

```js
window.flowDemo.createNode()
window.flowDemo.deleteSelectedNode()
window.flowDemo.clearCanvas()
window.flowDemo.toggleEditable()
```

## 组件 API（`FlowCanvas`）

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `readonly` | `Boolean` | `false` | 只读模式；内部 watch 该属性并同步节点交互与只读样式 |
| `readonlySelectable` | `Boolean` | `true` | 只读模式下是否仍允许选中节点；设为 `false` 时只读节点完全不响应点击 |

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `node-add` | 新节点数据 | 新增节点后触发 |
| `node-delete` | 被删除节点 id | 删除节点后触发 |
| `canvas-clear` | — | 清空画布后触发 |
| `selection-change` | `{ id, label } \| null` | 选中节点变化时触发 |
| `export` | JSON 字符串 | 导出图数据时触发 |
| `update:readonly` | `Boolean` | 切换只读状态时触发，支持 `:readonly.sync` |

作用域插槽 `sidebar` 会把当前选中节点的状态暴露给插槽内容：

| 插槽 prop | 类型 | 说明 |
| --- | --- | --- |
| `selectedNodeId` | `String \| null` | 当前选中节点 id |
| `selectedNodeLabel` | `String` | 当前选中节点名称（无选中时为「未选择节点」） |
| `hasSelectedNode` | `Boolean` | 是否存在选中节点 |
| `readonly` | `Boolean` | 当前是否只读 |
| `updateLabel` | `(label: String) => void` | 更新选中节点名称 |

```html
<flow-canvas :readonly.sync="readonly">
  <template #sidebar="slotProps">
    <editor-sidebar
      :selected-node-label="slotProps.selectedNodeLabel"
      :has-selected-node="slotProps.hasSelectedNode"
      :readonly="slotProps.readonly"
      @update-label="slotProps.updateLabel"
    />
  </template>
</flow-canvas>
```

## 组件 API（`EditorSidebar`）

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `selectedNodeLabel` | `String` | `'未选择节点'` | 当前选中节点名称，绑定输入框 |
| `hasSelectedNode` | `Boolean` | `false` | 是否存在选中节点，控制输入框禁用 |
| `readonly` | `Boolean` | `false` | 只读时输入框禁用 |

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `update-label` | 输入框最新值 | 输入框变更时触发，用于更新选中节点名称 |

## 说明

- 键盘删除快捷键已禁用，节点删除统一走工具栏逻辑，以保证桥接行为一致。
- `node_modules/`、`dist/` 等构建产物与系统文件已在 `.gitignore` 中忽略。
