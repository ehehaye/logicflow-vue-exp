<script>
import LogicFlow from '@logicflow/core'
import '@logicflow/core/dist/index.css'

/** 纵向串联时相邻节点的默认间距（px） */
const VERTICAL_GAP = 160

/**
 * FlowCanvas — 流程画布核心组件（基于 LogicFlow 2.x）。
 *
 * 职责：
 * - 在 `mounted` 中创建 LogicFlow 实例并渲染初始节点/连线；
 * - 提供工具栏操作：新增、删除、清空、适应画布、导出、切换只读；
 * - 维护节点顺序与图统计，管理选中态，并通过 `sidebar` 作用域插槽下发给父级。
 *
 * 只读语义：只读模式下节点始终不可拖动；连线始终不可交互。
 * 只读时是否仍可选中节点由 `readonlySelectable` 控制（默认为允许）。
 * 拖动语义：由 `draggable` prop 控制（默认 false），对节点、边同时生效，且需处于编辑态。
 */
export default {
  name: 'FlowCanvas',
  props: {
    /** 是否为只读模式（双向绑定：内部切换后通过 `update:readonly` 回传父级） */
    readonly: {
      type: Boolean,
      default: false,
    },
    /** 只读模式下是否仍允许选中节点 */
    readonlySelectable: {
      type: Boolean,
      default: true,
    },
    /** 是否允许拖动（对节点、边同时生效，默认不允许） */
    draggable: {
      type: Boolean,
      default: false,
    },
  },
  // 自定义事件统一 kebab-case，与父组件约定保持一致（见 AGENTS.md）
  emits: ['export', 'selection-change', 'node-add', 'node-delete', 'canvas-clear', 'update:readonly'],
  data() {
    return {
      /** LogicFlow 实例，在 mounted 中创建 */
      lf: null,
      /** 画布统计，用于驱动工具栏按钮的禁用态 */
      nodeCount: 0,
      edgeCount: 0,
      /** 当前是否可编辑，初值由 readonly prop 取反得到 */
      editable: !this.readonly,
      /** 当前选中节点的 id 与展示标签 */
      selectedNodeId: null,
      selectedNodeLabel: '未选择节点',
      /** 已创建节点的 id 顺序，用于定位“最后一个节点” */
      nodeSequence: ['start', 'task'],
      /** 自增序号，保证新增节点 / 连线的 id 唯一 */
      nextNodeIndex: 3,
      nextEdgeIndex: 2,
    }
  },
  computed: {
    /** 是否存在选中节点 */
    hasSelectedNode() {
      return Boolean(this.selectedNodeId)
    },
    /** 画布是否已有节点 */
    hasNodes() {
      return this.nodeCount > 0
    },
    /** 节点是否响应鼠标事件：编辑态恒可；只读态取决于 readonlySelectable */
    nodeHitable() {
      return this.editable || this.readonlySelectable
    },
    /** 是否允许拖动：编辑态且 draggable 为 true（对节点、边同时生效） */
    draggableEnabled() {
      return this.editable && this.draggable
    },
  },
  watch: {
    /** readonly prop 变化时同步到内部可编辑状态 */
    readonly(value) {
      this.applyEditable(!value)
    },
    /** readonlySelectable 变化时重设节点命中态 */
    readonlySelectable() {
      this.setNodesHitable(this.nodeHitable)
      if (!this.nodeHitable)
        this.clearNodeSelection()
    },
    /** draggable 变化时重新应用拖动权限（节点与边） */
    draggable() {
      this.applyEditable(this.editable)
    },
  },
  mounted() {
    // 创建实例：禁用键盘删除（删除统一走工具栏，以便自动桥接上下游）；拖动与连线交互由 applyEditable 按需开启
    this.lf = new LogicFlow({
      container: this.$refs.container,
      grid: {
        type: 'dot',
        size: 20,
        visible: true,
      },
      background: {
        backgroundColor: '#fbfcff',
      },
      keyboard: { enabled: false },
      hideAnchors: true,
      adjustEdge: false,
      edgeTextEdit: false,
      edgeTextDraggable: false,
      edgeSelectedOutline: false,
      nodeTextEdit: false,
      history: true,
    })

    // 渲染初始流程图（两个节点 + 一条连线）
    this.lf.render({
      nodes: [
        { id: 'start', type: 'circle', x: 430, y: 130, text: '开始' },
        { id: 'task', type: 'rect', x: 430, y: 290, text: '处理订单' },
      ],
      edges: [
        { id: 'start-to-task', type: 'polyline', sourceNodeId: 'start', targetNodeId: 'task' },
      ],
    })

    // 事件绑定：点击节点选中、点击空白取消选中、新增连线后置为只读
    this.lf.on('node:click', ({ data }) => {
      this.selectedNodeId = data.id
      this.emitSelection()
      this.updateGraphStats()
    })
    this.lf.on('blank:click', this.clearNodeSelection)
    this.lf.on('edge:add', ({ data }) => {
      this.setEdgeHitable(data.id)
      this.updateGraphStats()
    })

    // 初始化连线命中态、统计与编辑态
    this.setEdgesHitable()
    this.updateGraphStats()
    this.applyEditable(this.editable)
  },
  beforeDestroy() {
    // 销毁实例，释放事件与 DOM 引用
    if (this.lf) {
      this.lf.destroy()
    }
  },
  methods: {
    /**
     * 新增节点。
     * - 默认（`position = 'append'`）接在当前最后一个节点下方，并自动连线；
     * - `'before'` / `'after'` 需存在选中节点，分别在选中节点前 / 后插入：
     *   新节点占用相邻槽位，选中节点或其下游整体下移一格腾位，并重定向相关连线。
     */
    createNode(position = 'append') {
      const nodeId = `node-${this.nextNodeIndex}`
      const text = `步骤 ${this.nextNodeIndex - 2}`

      if (position === 'before' && this.hasSelectedNode)
        this.insertNodeRelativeToSelected(nodeId, text, 'before')
      else if (position === 'after' && this.hasSelectedNode)
        this.insertNodeRelativeToSelected(nodeId, text, 'after')
      else
        this.appendNode(nodeId, text)

      this.nextNodeIndex += 1
      const node = this.lf.getNodeModelById(nodeId)
      node.setHitable(this.nodeHitable)
      this.lf.selectElementById(nodeId)
      this.selectedNodeId = nodeId
      this.emitSelection()
      this.updateGraphStats()
      this.$emit('node-add', node.getData())
      this.fitView()
    },
    /** 在最后一个节点下方追加节点并自动连线（默认新增行为） */
    appendNode(nodeId, text) {
      const tail = this.getLastNode()
      this.lf.addNode({
        id: nodeId,
        type: 'rect',
        x: tail ? tail.x : 430,
        y: tail ? tail.y + VERTICAL_GAP : 130,
        text,
      })

      if (tail)
        this.connectNodes(tail.id, nodeId)
      this.nodeSequence.push(nodeId)
    },
    /** 在选中节点前 / 后插入节点：腾出相邻槽位并重定向相关连线 */
    insertNodeRelativeToSelected(nodeId, text, direction) {
      const selected = this.lf.getNodeModelById(this.selectedNodeId)
      const { id: selectedId, x, y } = selected

      if (direction === 'before') {
        // 选中节点及其下游整体下移一格，新节点占用选中节点原来的槽位
        this.shiftSubtree(selectedId, VERTICAL_GAP)
        this.lf.addNode({ id: nodeId, type: 'rect', x, y, text })
        // 选中节点的入边改为指向新节点，新节点再连回选中节点
        this.lf.getNodeIncomingEdge(selectedId).map(edge => edge.getData()).forEach((edge) => {
          this.lf.deleteEdge(edge.id)
          this.connectNodes(edge.sourceNodeId, nodeId)
        })
        this.connectNodes(nodeId, selectedId)
        this.insertSequence(selectedId, nodeId, 'before')
      }
      else {
        // 选中节点的下游整体下移一格，新节点占用其正下方的槽位
        this.lf.getNodeOutgoingNode(selectedId).forEach(child => this.shiftSubtree(child.id, VERTICAL_GAP))
        this.lf.addNode({ id: nodeId, type: 'rect', x, y: y + VERTICAL_GAP, text })
        // 选中节点的出边改为从新节点出发，选中节点再接入新节点
        this.lf.getNodeOutgoingEdge(selectedId).map(edge => edge.getData()).forEach((edge) => {
          this.lf.deleteEdge(edge.id)
          this.connectNodes(nodeId, edge.targetNodeId)
        })
        this.connectNodes(selectedId, nodeId)
        this.insertSequence(selectedId, nodeId, 'after')
      }
    },
    /** 把以 rootId 为根的整棵子树（含自身）沿 y 方向整体平移 delta */
    shiftSubtree(rootId, delta) {
      const visited = new Set()
      const queue = [rootId]
      while (queue.length) {
        const id = queue.shift()
        if (visited.has(id))
          continue
        visited.add(id)
        if (this.lf.getNodeModelById(id))
          this.lf.graphModel.moveNode(id, 0, delta, true)
        this.lf.getNodeOutgoingNode(id).forEach(child => queue.push(child.id))
      }
    },
    /** 把 nodeId 依方向写入 nodeSequence，保持记录的逻辑顺序与图一致 */
    insertSequence(targetId, nodeId, direction) {
      const index = this.nodeSequence.indexOf(targetId)
      if (index === -1) {
        this.nodeSequence.push(nodeId)
        return
      }
      this.nodeSequence.splice(direction === 'before' ? index : index + 1, 0, nodeId)
    },
    /** 下拉菜单选择插入位置后执行新增 */
    chooseCreate(position) {
      if (!this.editable)
        return
      this.createNode(position)
    },
    /** 删除选中节点；删除后把所有上游节点桥接到所有下游节点，并让下游节点逐个补位 */
    deleteSelectedNode() {
      if (!this.selectedNodeId)
        return

      const deletedNodeId = this.selectedNodeId
      const incomingEdges = this.lf.getNodeIncomingEdge(deletedNodeId).map(edge => edge.getData())
      const outgoingEdges = this.lf.getNodeOutgoingEdge(deletedNodeId).map(edge => edge.getData())

      // 交叉配对：每个上游 × 每个下游，保证删除后图仍连通
      const bridgePairs = incomingEdges.flatMap(incoming =>
        outgoingEdges.map(outgoing => ({
          sourceNodeId: incoming.sourceNodeId,
          targetNodeId: outgoing.targetNodeId,
        })),
      )

      // 删除前记录下游链路的补位目标：每个节点挪到其上游节点原本的位置
      const downstreamMoves = this.collectDownstreamMoves(deletedNodeId)

      this.lf.deleteNode(deletedNodeId)
      this.nodeSequence = this.nodeSequence.filter(nodeId => nodeId !== deletedNodeId)
      bridgePairs.forEach(({ sourceNodeId, targetNodeId }) => this.connectNodes(sourceNodeId, targetNodeId))
      this.applyDownstreamMoves(downstreamMoves)

      this.selectedNodeId = null
      this.emitSelection()
      this.updateGraphStats()
      this.$emit('node-delete', deletedNodeId)
      this.fitView()
    },
    /** 遍历待删节点的下游链路，返回每个下游节点的补位目标（其上游节点删除前的坐标） */
    collectDownstreamMoves(deletedNodeId) {
      const deletedModel = this.lf.getNodeModelById(deletedNodeId)
      const moves = []
      const visited = new Set([deletedNodeId])
      const queue = [{ id: deletedNodeId, x: deletedModel.x, y: deletedModel.y }]

      while (queue.length) {
        const parent = queue.shift()
        this.lf.getNodeOutgoingNode(parent.id).forEach((child) => {
          if (visited.has(child.id))
            return
          visited.add(child.id)
          // 下游节点补位到上游节点原本的位置（均往前 +1 格）
          moves.push({ id: child.id, x: parent.x, y: parent.y })
          // 用删除前的坐标作为再下一层的补位目标
          queue.push({ id: child.id, x: child.x, y: child.y })
        })
      }
      return moves
    },
    /** 按补位目标移动节点（连带其相连的边一起移动） */
    applyDownstreamMoves(moves) {
      moves.forEach(({ id, x, y }) => {
        const model = this.lf.getNodeModelById(id)
        if (!model)
          return
        this.lf.graphModel.moveNode(id, x - model.x, y - model.y, true)
      })
    },
    /** 清空画布数据与内部状态 */
    clearCanvas() {
      if (!this.nodeCount)
        return
      this.lf.clearData()
      this.nodeSequence = []
      this.selectedNodeId = null
      this.emitSelection()
      this.updateGraphStats()
      this.$emit('canvas-clear')
    },
    /** 应用编辑 / 只读状态：同步到 LogicFlow 配置与节点、连线的命中（hitable） */
    applyEditable(editable) {
      this.editable = editable
      // 拖动权限 = 编辑态 && draggable，对节点、边同时生效
      this.lf.updateEditConfig({
        adjustNodePosition: this.draggableEnabled,
        adjustEdge: this.draggableEnabled,
      })
      this.setNodesHitable(this.nodeHitable)
      this.setEdgesHitable()
      // 节点不可交互时，清空已有选中态
      if (!this.nodeHitable)
        this.clearNodeSelection()
    },
    /** 切换编辑 / 只读，并把新的只读态通过 `update:readonly` 回传父级 */
    toggleEditable() {
      const editable = !this.editable
      this.applyEditable(editable)
      this.$emit('update:readonly', !editable)
    },
    /** 批量设置所有节点是否可被点击 / 拖动 */
    setNodesHitable(hitable) {
      this.lf.getGraphData().nodes.forEach((node) => {
        const model = this.lf.getNodeModelById(node.id)
        if (model)
          model.setHitable(hitable)
      })
    },
    /** 缩放画布以适配全部内容（四周留 80px 边距） */
    fitView() {
      this.lf.fitView(80, 80)
    },
    /** 将当前图数据以格式化 JSON 通过 `export` 事件抛出 */
    exportGraph() {
      this.$emit('export', JSON.stringify(this.lf.getGraphData(), null, 2))
    },
    /** 连接两个节点；已存在同向连线或为自连时跳过 */
    connectNodes(sourceNodeId, targetNodeId) {
      const hasSameEdge = this.lf
        .getGraphData()
        .edges
        .some(edge => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId)

      if (hasSameEdge || sourceNodeId === targetNodeId)
        return
      const edge = this.lf.addEdge({
        id: `edge-${this.nextEdgeIndex}`,
        type: 'polyline',
        sourceNodeId,
        targetNodeId,
      })
      this.nextEdgeIndex += 1
      this.setEdgeHitable(edge.id)
    },
    /** 返回 nodeSequence 中仍然存在且最靠后的节点（作为新增节点的落点） */
    getLastNode() {
      const nodes = this.lf.getGraphData().nodes
      const nodeIds = new Set(nodes.map(node => node.id))
      const lastNodeId = [...this.nodeSequence].reverse().find(nodeId => nodeIds.has(nodeId))
      return nodes.find(node => node.id === lastNodeId)
    },
    /** 让单条连线的可交互状态跟随拖动权限（可拖动才可命中） */
    setEdgeHitable(edgeId) {
      const edge = this.lf.getEdgeModelById(edgeId)
      if (edge)
        edge.setHitable(this.draggableEnabled)
    },
    /** 批量同步所有连线的可交互状态 */
    setEdgesHitable() {
      this.lf.getGraphData().edges.forEach(edge => this.setEdgeHitable(edge.id))
    },
    /** 清空画布与组件内的选中态 */
    clearNodeSelection() {
      this.lf.clearSelectElements()
      this.selectedNodeId = null
      this.emitSelection()
    },
    /** 取节点文本，兼容字符串与 `{ value }` 两种形态 */
    getNodeText(node) {
      return typeof node.text === 'string' ? node.text : node.text.value
    },
    /** 依据当前选中节点刷新标签，并通过 `selection-change` 抛出选中信息 */
    emitSelection() {
      const node = this.selectedNodeId
        ? this.lf.getGraphData().nodes.find(item => item.id === this.selectedNodeId)
        : null
      this.selectedNodeLabel = node ? this.getNodeText(node) : '未选择节点'
      this.$emit('selection-change', node ? { id: node.id, label: this.selectedNodeLabel } : null)
    },
    /** 由 `sidebar` 插槽回调触发：更新选中节点的文本 */
    updateSelectedNodeLabel(label) {
      if (!this.selectedNodeId)
        return
      const value = typeof label === 'string' ? label : String(label)
      this.lf.updateText(this.selectedNodeId, value)
      this.selectedNodeLabel = value
      this.$emit('selection-change', { id: this.selectedNodeId, label: value })
    },
    /** 重新统计节点 / 连线数量 */
    updateGraphStats() {
      const data = this.lf.getGraphData()
      this.nodeCount = data.nodes.length
      this.edgeCount = data.edges.length
    },
  },
}
</script>

<template>
  <div>
    <div
      class="tw-grid tw-grid-cols-flow-editor tw-min-h-flow-panel tw-overflow-hidden tw-bg-white tw-border tw-border-[#dfe5f0] tw-rounded-2xl tw-shadow-panel tw-max-w-[1440px] tw-mx-auto"
      :class="editable ? 'flow-canvas--editable' : 'flow-canvas--readonly'"
    >
      <div class="tw-flex tw-relative tw-flex-col tw-min-w-0">
        <div class="tw-flex tw-justify-between tw-py-[14px] tw-px-5 tw-text-xs tw-text-[#71809a] tw-bg-white tw-border-b tw-border-[#e8edf5]">
          <div class="flow-toolbar tw-flex tw-items-center tw-gap-[10px]">
            <el-dropdown trigger="click" :disabled="!editable" @command="chooseCreate">
              <el-button type="primary" :disabled="!editable">
                新增节点<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="append">
                  末尾追加
                </el-dropdown-item>
                <el-dropdown-item command="before" :disabled="!hasSelectedNode">
                  插入到选中节点前
                </el-dropdown-item>
                <el-dropdown-item command="after" :disabled="!hasSelectedNode">
                  插入到选中节点后
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-button type="danger" :disabled="!hasSelectedNode || !editable" @click="deleteSelectedNode">
              删除选中节点
            </el-button>
            <el-button :disabled="!hasNodes || !editable" @click="clearCanvas">
              清空画布
            </el-button>
            <el-button @click="fitView">
              适应画布
            </el-button>
            <el-button type="primary" @click="exportGraph">
              导出 JSON
            </el-button>
            <el-button @click="toggleEditable">
              {{ editable ? '切换只读' : '切换编辑' }}
            </el-button>
          </div>
        </div>
        <div ref="container" class="tw-flex-1 tw-min-h-[620px]" />
      </div>
      <slot
        name="sidebar"
        :selected-node-id="selectedNodeId"
        :selected-node-label="selectedNodeLabel"
        :has-selected-node="hasSelectedNode"
        :readonly="readonly"
        :update-label="updateSelectedNodeLabel"
      />
    </div>
  </div>
</template>
