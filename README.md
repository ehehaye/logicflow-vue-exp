# LogicFlow · Vue 2 Demo

基于 **Vue 2.7 + LogicFlow + Vite** 的流程编辑器示例。演示如何在 Vue 2 项目中集成 LogicFlow，实现节点的增删、拖拽、串联与流程图 JSON 导出。

## 功能

- 初始化「开始 → 处理订单」示例流程
- 新增节点并按顺序纵向串联，自动连线
- 选中并拖拽节点调整位置
- 删除节点时自动桥接其上下游节点
- 清空画布、适应画布、导出流程 JSON
- 连线只读：不可选中、不可编辑、不可调整

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
2. 点击节点可选中并拖动；点击空白处取消选择。
3. 点击 **删除选中节点**：删除后会保留其上游到下游的连接关系。
4. 点击 **清空画布**：需先选中任意节点。
5. 点击 **适应画布**：自动缩放到内容范围。
6. 点击 **导出 JSON**：以弹窗展示当前画布的图数据。

此外，编辑器在 `mounted` 时会把常用方法挂到 `window.flowDemo`，便于在浏览器控制台或集成测试中调用：

```js
window.flowDemo.createNode()
window.flowDemo.deleteSelectedNode()
window.flowDemo.clearCanvas()
```

## 说明

- 键盘删除快捷键已禁用，节点删除统一走工具栏逻辑，以保证桥接行为一致。
- `node_modules/`、`dist/` 等构建产物与系统文件已在 `.gitignore` 中忽略。
