<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">VUE 2 + VITE + PNPM</p>
        <h1>LogicFlow 流程编辑器</h1>
      </div>
      <div class="topbar-actions">
        <button class="primary-button" type="button" @click="createNode">新增节点</button>
        <button
          class="danger-button"
          type="button"
          :disabled="!hasSelectedNode"
          @click="deleteSelectedNode"
        >
          删除选中节点
        </button>
        <button
          class="ghost-button"
          type="button"
          :disabled="!hasNodes"
          @click="clearCanvas"
        >
          清空画布
        </button>
        <button class="ghost-button" type="button" @click="fitView">适应画布</button>
        <button class="primary-button" type="button" @click="exportGraph">导出 JSON</button>
      </div>
    </header>

    <section class="workspace">
      <aside class="sidebar">
        <div>
          <p class="section-label">流程控制</p>
          <h2>纵向串联节点</h2>
          <p class="hint">每次新增节点都会自动接在当前最后一个节点的下方。</p>
        </div>

        <div class="selected-card">
          <p class="section-label">当前选择</p>
          <strong>{{ selectedNodeLabel }}</strong>
          <small v-if="hasSelectedNode">可拖动节点；删除时会自动桥接上下游。</small>
          <small v-else>请先在画布中选择一个节点。</small>
        </div>

        <div class="tips">
          <p class="section-label">操作提示</p>
          <ol>
            <li>点击节点后可拖动调整位置。</li>
            <li>边不可选中、不可调整或编辑。</li>
            <li>删除中间节点会自动连接其前后节点。</li>
            <li>清空操作需要先选中任意节点。</li>
          </ol>
        </div>
      </aside>

      <section class="canvas-panel">
        <div class="canvas-meta">
          <span><i class="status-dot"></i> 可编辑</span>
          <span>{{ nodeCount }} 个节点 · {{ edgeCount }} 条只读连线</span>
        </div>
        <div ref="container" class="flow-canvas"></div>
      </section>
    </section>

    <div v-if="jsonVisible" class="dialog-mask" @click.self="jsonVisible = false">
      <section class="json-dialog" role="dialog" aria-modal="true" aria-label="流程 JSON">
        <div class="dialog-header">
          <div>
            <p class="section-label">FLOW DATA</p>
            <h2>当前画布 JSON</h2>
          </div>
          <button class="close-button" type="button" aria-label="关闭" @click="jsonVisible = false">×</button>
        </div>
        <pre>{{ graphJson }}</pre>
      </section>
    </div>
  </main>
</template>

<script>
import LogicFlow from '@logicflow/core'
import '@logicflow/core/dist/index.css'

export default {
  name: 'App',
  data() {
    return {
      lf: null,
      nodeCount: 0,
      edgeCount: 0,
      selectedNodeId: null,
      nodeSequence: ['start', 'task'],
      nextNodeIndex: 3,
      nextEdgeIndex: 2,
      jsonVisible: false,
      graphJson: '',
    }
  },
  computed: {
    hasSelectedNode() {
      return Boolean(this.selectedNodeId)
    },
    hasNodes() {
      return this.nodeCount > 0
    },
    selectedNodeLabel() {
      if (!this.selectedNodeId) return '未选择节点'
      const node = this.lf.getGraphData().nodes.find((item) => item.id === this.selectedNodeId)
      return node ? this.getNodeText(node) : '未选择节点'
    },
  },
  mounted() {
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
      // Only toolbar actions may delete nodes, so the default keyboard deletion
      // shortcut cannot bypass the bridge-and-delete logic below.
      keyboard: { enabled: false },
      adjustEdge: false,
      edgeTextEdit: false,
      edgeTextDraggable: false,
      edgeSelectedOutline: false,
      nodeTextEdit: false,
      history: true,
    })

    this.lf.render({
      nodes: [
        { id: 'start', type: 'circle', x: 430, y: 130, text: '开始' },
        { id: 'task', type: 'rect', x: 430, y: 290, text: '处理订单' },
      ],
      edges: [
        { id: 'start-to-task', type: 'polyline', sourceNodeId: 'start', targetNodeId: 'task' },
      ],
    })

    this.lf.on('node:click', ({ data }) => {
      this.selectedNodeId = data.id
      this.updateGraphStats()
    })
    this.lf.on('blank:click', this.clearNodeSelection)
    this.lf.on('edge:add', ({ data }) => {
      this.makeEdgeReadonly(data.id)
      this.updateGraphStats()
    })
    this.makeAllEdgesReadonly()
    this.updateGraphStats()

    // The same methods used by the buttons are exposed for integration tests
    // or browser-console experimentation: window.flowDemo.createNode(), etc.
    window.flowDemo = {
      createNode: this.createNode,
      deleteSelectedNode: this.deleteSelectedNode,
      clearCanvas: this.clearCanvas,
    }
  },
  beforeDestroy() {
    if (window.flowDemo) delete window.flowDemo
    if (this.lf) {
      this.lf.destroy()
    }
  },
  methods: {
    createNode() {
      const tail = this.getLastNode()
      const nodeId = `node-${this.nextNodeIndex}`
      const node = this.lf.addNode({
        id: nodeId,
        type: 'rect',
        x: tail ? tail.x : 430,
        y: tail ? tail.y + 160 : 130,
        text: `步骤 ${this.nextNodeIndex - 2}`,
      })

      if (tail) this.connectNodes(tail.id, nodeId)
      this.nodeSequence.push(nodeId)
      this.nextNodeIndex += 1
      this.lf.selectElementById(node.id)
      this.selectedNodeId = node.id
      this.updateGraphStats()
    },
    deleteSelectedNode() {
      if (!this.selectedNodeId) return

      const deletedNodeId = this.selectedNodeId
      const incomingEdges = this.lf.getNodeIncomingEdge(deletedNodeId).map((edge) => edge.getData())
      const outgoingEdges = this.lf.getNodeOutgoingEdge(deletedNodeId).map((edge) => edge.getData())

      // Preserve every valid predecessor → successor path before LogicFlow
      // removes the incident edges together with the selected node.
      const bridgePairs = incomingEdges.flatMap((incoming) =>
        outgoingEdges.map((outgoing) => ({
          sourceNodeId: incoming.sourceNodeId,
          targetNodeId: outgoing.targetNodeId,
        })),
      )

      this.lf.deleteNode(deletedNodeId)
      this.nodeSequence = this.nodeSequence.filter((nodeId) => nodeId !== deletedNodeId)
      bridgePairs.forEach(({ sourceNodeId, targetNodeId }) => this.connectNodes(sourceNodeId, targetNodeId))

      this.selectedNodeId = null
      this.updateGraphStats()
    },
    clearCanvas() {
      if (!this.nodeCount) return
      this.lf.clearData()
      this.nodeSequence = []
      this.selectedNodeId = null
      this.updateGraphStats()
    },
    connectNodes(sourceNodeId, targetNodeId) {
      const hasSameEdge = this.lf
        .getGraphData()
        .edges.some((edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId)

      if (hasSameEdge || sourceNodeId === targetNodeId) return
      const edge = this.lf.addEdge({
        id: `edge-${this.nextEdgeIndex}`,
        type: 'polyline',
        sourceNodeId,
        targetNodeId,
      })
      this.nextEdgeIndex += 1
      this.makeEdgeReadonly(edge.id)
    },
    getLastNode() {
      const nodes = this.lf.getGraphData().nodes
      const nodeIds = new Set(nodes.map((node) => node.id))
      const lastNodeId = [...this.nodeSequence].reverse().find((nodeId) => nodeIds.has(nodeId))
      return nodes.find((node) => node.id === lastNodeId)
    },
    makeEdgeReadonly(edgeId) {
      const edge = this.lf.getEdgeModelById(edgeId)
      if (edge) edge.setHitable(false)
    },
    makeAllEdgesReadonly() {
      this.lf.getGraphData().edges.forEach((edge) => this.makeEdgeReadonly(edge.id))
    },
    clearNodeSelection() {
      this.lf.clearSelectElements()
      this.selectedNodeId = null
    },
    getNodeText(node) {
      return typeof node.text === 'string' ? node.text : node.text.value
    },
    updateGraphStats() {
      const data = this.lf.getGraphData()
      this.nodeCount = data.nodes.length
      this.edgeCount = data.edges.length
    },
    fitView() {
      this.lf.fitView(80, 80)
    },
    exportGraph() {
      this.graphJson = JSON.stringify(this.lf.getGraphData(), null, 2)
      this.jsonVisible = true
    },
  },
}
</script>
