<template>
  <div>
    <div
      class="tw-grid tw-grid-cols-flow-editor tw-min-h-flow-panel tw-overflow-hidden tw-bg-white tw-border tw-border-[#dfe5f0] tw-rounded-2xl tw-shadow-panel tw-max-w-[1440px] tw-mx-auto"
      :class="editable ? 'flow-canvas--editable' : 'flow-canvas--readonly'"
    >
      <div class="tw-flex tw-relative tw-flex-col tw-min-w-0">
        <div
          class="tw-flex tw-justify-between tw-py-[14px] tw-px-5 tw-text-xs tw-text-[#71809a] tw-bg-white tw-border-b tw-border-[#e8edf5]"
        >
          <div class="flow-toolbar tw-flex tw-items-center tw-gap-[10px]">
            <el-dropdown
              trigger="click"
              :disabled="!editable"
              @command="handleCreate"
            >
              <el-button
                type="primary"
                :disabled="!editable"
              >
                新增节点<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="append"> 末尾追加 </el-dropdown-item>
                <el-dropdown-item
                  command="before"
                  :disabled="!hasSelectedNode"
                >
                  插入到选中节点前
                </el-dropdown-item>
                <el-dropdown-item
                  command="after"
                  :disabled="!hasSelectedNode"
                >
                  插入到选中节点后
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <el-button
              type="danger"
              :disabled="!hasSelectedNode || !editable"
              @click="deleteSelectedNode"
            >
              删除选中节点
            </el-button>
            <el-button
              :disabled="!hasNodes || !editable"
              @click="clearCanvas"
            >
              清空画布
            </el-button>
            <el-button @click="fitView"> 适应画布 </el-button>
            <el-button
              type="primary"
              @click="exportGraph"
            >
              导出 JSON
            </el-button>
            <el-button @click="toggleEditable">
              {{ editable ? '切换只读' : '切换编辑' }}
            </el-button>
          </div>
        </div>
        <div
          ref="container"
          class="tw-flex-1 tw-min-h-[620px]"
        />
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

<script>
import { defineComponent } from 'vue';
import LogicFlow from '@logicflow/core';
import '@logicflow/core/dist/index.css';

const VERTICAL_GAP = 160;

const EVENTS = {
  EXPORT: 'export',
  SELECTION_CHANGE: 'selection-change',
  NODE_ADD: 'node-add',
  NODE_DELETE: 'node-delete',
  CANVAS_CLEAR: 'canvas-clear',
  UPDATE_READONLY: 'update:readonly',
  GRAPH_CHANGE: 'graph-change',
};

/**
 * FlowCanvas —— 基于 LogicFlow 2.x 的流程画布组件。
 *
 * 职责：
 * - 在 `mounted` 中创建 LogicFlow 实例并渲染初始流程图；
 * - 提供工具栏操作：新增、删除、清空、适应画布、导出、切换只读；
 * - 维护节点顺序与图统计，管理选中态，并经 `sidebar` 作用域插槽下发给父级。
 *
 * 交互语义：
 * - 只读模式（`readonly`）下节点不可拖动、连线不可交互；是否仍可选中由 `readonlySelectable` 控制（默认允许）。
 * - 拖动（`draggable`，默认关闭）对节点与边同时生效，且仅在编辑态下可用。
 */
export default defineComponent({
  name: 'FlowCanvas',
  props: {
    /** 是否只读（内部切换后经 `update:readonly` 回传父级）。 */
    readonly: {
      type: Boolean,
      default: false,
    },
    /** 只读模式下是否仍允许选中节点。 */
    readonlySelectable: {
      type: Boolean,
      default: true,
    },
    /** 是否允许拖动（节点与边同时生效）。 */
    draggable: {
      type: Boolean,
      default: false,
    },
    /** 自定义数据转换函数：把外部数据格式转换为 LogicFlow 内部图数据（对应实例 `adapterIn`）。 */
    adapterIn: {
      type: Function,
      default: null,
    },
    /** 自定义数据转换函数：把 LogicFlow 内部图数据转换为外部数据格式（对应实例 `adapterOut`）。 */
    adapterOut: {
      type: Function,
      default: null,
    },
    /** 初始图数据（LogicFlow 内部格式），经 `renderRawData` 直接渲染，不经过 `adapterIn` 转换。 */
    rawData: {
      type: Object,
      default: () => ({
        nodes: [],
        edges: [],
      }),
    },
  },
  emits: Object.values(EVENTS),
  data() {
    return {
      $lf: null,
      nodeCount: 0,
      edgeCount: 0,
      editable: !this.readonly,
      selectedNodeId: null,
      selectedNodeLabel: '未选择节点',
      nodeSequence: ['start', 'task'],
      nextNodeIndex: 0,
      nextEdgeIndex: 0,
    };
  },
  computed: {
    hasSelectedNode() {
      return Boolean(this.selectedNodeId);
    },
    hasNodes() {
      return this.nodeCount > 0;
    },
    nodeHitable() {
      return this.editable || this.readonlySelectable;
    },
    draggableEnabled() {
      return this.editable && this.draggable;
    },
  },
  watch: {
    readonly(value) {
      this.applyEditable(!value);
    },
    readonlySelectable() {
      this.setNodesHitable(this.nodeHitable);
      if (!this.nodeHitable) this.clearNodeSelection();
    },
    /** `draggable` 变化时重新应用拖动权限。 */
    draggable() {
      this.applyEditable(this.editable);
    },
  },
  mounted() {
    this.$lf = new LogicFlow({
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
    });

    // 注册外部数据适配器（若提供）。
    if (this.adapterIn) this.$lf.adapterIn = this.adapterIn;
    if (this.adapterOut) this.$lf.adapterOut = this.adapterOut;

    // 渲染初始流程图：rawData 为 LogicFlow 内部格式，经 renderRawData 直接渲染。
    if (this.rawData) this.$lf.renderRawData(this.rawData);

    // 事件绑定：点击节点选中、点击空白取消选中、新增连线后同步命中态与统计。
    this.$lf.on('node:click', ({ data }) => {
      this.selectedNodeId = data.id;
      this.emitSelection();
      this.updateGraphStats();
    });
    this.$lf.on('blank:click', this.clearNodeSelection);
    this.$lf.on('edge:add', ({ data }) => {
      this.setEdgeHitable(data.id);
      this.updateGraphStats();
    });

    // 初始化连线命中态、统计与编辑态。
    this.setEdgesHitable();
    this.updateGraphStats();
    this.applyEditable(this.editable);
  },
  beforeDestroy() {
    if (this.$lf) {
      this.$lf.destroy();
    }
  },
  methods: {
    /**
     * 新增节点：默认追加到末节点下方；存在选中节点时可按需前插 / 后插。
     * @param {'append' | 'before' | 'after'} [position='append'] 插入位置。
     */
    createNode(position = 'append') {
      const nodeId = `node-${this.nextNodeIndex}`;
      const text = `步骤 ${this.nextNodeIndex - 2}`;

      if (position === 'before' && this.hasSelectedNode) this.insertNodeRelativeToSelected(nodeId, text, 'before');
      else if (position === 'after' && this.hasSelectedNode) this.insertNodeRelativeToSelected(nodeId, text, 'after');
      else this.appendNode(nodeId, text);

      this.nextNodeIndex += 1;
      const node = this.$lf.getNodeModelById(nodeId);
      node.setHitable(this.nodeHitable);
      this.$lf.selectElementById(nodeId);
      this.selectedNodeId = nodeId;
      this.emitSelection();
      this.updateGraphStats();
      this.$emit(EVENTS.NODE_ADD, node.getData());
      this.fitView();
    },
    /**
     * 在末节点下方追加节点并自动连线。
     * @param {string} nodeId 新节点 id。
     * @param {string} text 节点文本。
     */
    appendNode(nodeId, text) {
      const tail = this.getLastNode();
      this.$lf.addNode({
        id: nodeId,
        type: 'rect',
        x: tail ? tail.x : 430,
        y: tail ? tail.y + VERTICAL_GAP : 130,
        text,
      });

      if (tail) this.connectNodes(tail.id, nodeId);
      this.nodeSequence.push(nodeId);
    },
    /**
     * 在选中节点前 / 后插入节点：腾出相邻槽位并重定向相关连线。
     * @param {string} nodeId 新节点 id。
     * @param {string} text 节点文本。
     * @param {'before' | 'after'} direction 插入方向。
     */
    insertNodeRelativeToSelected(nodeId, text, direction) {
      const selected = this.$lf.getNodeModelById(this.selectedNodeId);
      const { id: selectedId, x, y } = selected;

      if (direction === 'before') {
        // 选中节点及其下游整体下移一格，新节点占用选中节点原来的槽位。
        this.shiftSubtree(selectedId, VERTICAL_GAP);
        this.$lf.addNode({ id: nodeId, type: 'rect', x, y, text });
        // 选中节点的入边改指向新节点，新节点再连回选中节点。
        this.$lf
          .getNodeIncomingEdge(selectedId)
          .map((edge) => edge.getData())
          .forEach((edge) => {
            this.$lf.deleteEdge(edge.id);
            this.connectNodes(edge.sourceNodeId, nodeId);
          });
        this.connectNodes(nodeId, selectedId);
        this.insertSequence(selectedId, nodeId, 'before');
      } else {
        // 选中节点的下游整体下移一格，新节点占用其正下方的槽位。
        this.$lf.getNodeOutgoingNode(selectedId).forEach((child) => this.shiftSubtree(child.id, VERTICAL_GAP));
        this.$lf.addNode({ id: nodeId, type: 'rect', x, y: y + VERTICAL_GAP, text });
        // 选中节点的出边改从新节点出发，选中节点再接入新节点。
        this.$lf
          .getNodeOutgoingEdge(selectedId)
          .map((edge) => edge.getData())
          .forEach((edge) => {
            this.$lf.deleteEdge(edge.id);
            this.connectNodes(nodeId, edge.targetNodeId);
          });
        this.connectNodes(selectedId, nodeId);
        this.insertSequence(selectedId, nodeId, 'after');
      }
    },
    /**
     * 将以 `rootId` 为根的子树（含自身）沿 y 轴整体平移 `delta`。
     * @param {string} rootId 子树根节点 id。
     * @param {number} delta 平移量（px）。
     */
    shiftSubtree(rootId, delta) {
      const visited = new Set();
      const queue = [rootId];
      while (queue.length) {
        const id = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        if (this.$lf.getNodeModelById(id)) this.$lf.graphModel.moveNode(id, 0, delta, true);
        this.$lf.getNodeOutgoingNode(id).forEach((child) => queue.push(child.id));
      }
    },
    /**
     * 按方向把 `nodeId` 写入 `nodeSequence`，保持记录顺序与图一致。
     * @param {string} targetId 参照节点 id。
     * @param {string} nodeId 待插入节点 id。
     * @param {'before' | 'after'} direction 插入方向。
     */
    insertSequence(targetId, nodeId, direction) {
      const index = this.nodeSequence.indexOf(targetId);
      if (index === -1) {
        this.nodeSequence.push(nodeId);
        return;
      }
      this.nodeSequence.splice(direction === 'before' ? index : index + 1, 0, nodeId);
    },
    /**
     * 下拉菜单选择插入位置后执行新增。
     * @param {'append' | 'before' | 'after'} position 插入位置。
     */
    handleCreate(position) {
      if (!this.editable) return;
      this.createNode(position);
    },
    /**
     * 删除选中节点：将其所有上游桥接到所有下游，并让下游节点逐个补位。
     */
    deleteSelectedNode() {
      if (!this.selectedNodeId) return;

      const deletedNodeId = this.selectedNodeId;
      const incomingEdges = this.$lf.getNodeIncomingEdge(deletedNodeId).map((edge) => edge.getData());
      const outgoingEdges = this.$lf.getNodeOutgoingEdge(deletedNodeId).map((edge) => edge.getData());

      // 交叉配对：每个上游 × 每个下游，保证删除后图仍连通。
      const bridgePairs = incomingEdges.flatMap((incoming) =>
        outgoingEdges.map((outgoing) => ({
          sourceNodeId: incoming.sourceNodeId,
          targetNodeId: outgoing.targetNodeId,
        })),
      );

      // 删除前记录下游链路补位目标：每个下游节点上移到其上游删除前的坐标。
      const downstreamMoves = this.collectDownstreamMoves(deletedNodeId);

      this.$lf.deleteNode(deletedNodeId);
      this.nodeSequence = this.nodeSequence.filter((nodeId) => nodeId !== deletedNodeId);
      bridgePairs.forEach(({ sourceNodeId, targetNodeId }) => this.connectNodes(sourceNodeId, targetNodeId));
      this.applyDownstreamMoves(downstreamMoves);

      this.selectedNodeId = null;
      this.emitSelection();
      this.updateGraphStats();
      this.$emit(EVENTS.NODE_DELETE, deletedNodeId);
      this.fitView();
    },
    /**
     * 收集待删节点的下游补位目标：每个下游节点上移到其上游删除前的坐标。
     * @param {string} deletedNodeId 待删除节点 id。
     * @returns {Array<{ id: string, x: number, y: number }>} 补位目标列表。
     */
    collectDownstreamMoves(deletedNodeId) {
      const deletedModel = this.$lf.getNodeModelById(deletedNodeId);
      const moves = [];
      const visited = new Set([deletedNodeId]);
      const queue = [{ id: deletedNodeId, x: deletedModel.x, y: deletedModel.y }];

      while (queue.length) {
        const parent = queue.shift();
        this.$lf.getNodeOutgoingNode(parent.id).forEach((child) => {
          if (visited.has(child.id)) return;
          visited.add(child.id);
          // 下游节点补位到其上游删除前的位置（整体前移一格）。
          moves.push({ id: child.id, x: parent.x, y: parent.y });
          // 以该节点删除前的坐标作为其子节点的补位目标。
          queue.push({ id: child.id, x: child.x, y: child.y });
        });
      }
      return moves;
    },
    /**
     * 按补位目标移动节点（连带相连边一起移动）。
     * @param {Array<{ id: string, x: number, y: number }>} moves 补位目标列表。
     */
    applyDownstreamMoves(moves) {
      moves.forEach(({ id, x, y }) => {
        const model = this.$lf.getNodeModelById(id);
        if (!model) return;
        this.$lf.graphModel.moveNode(id, x - model.x, y - model.y, true);
      });
    },
    /**
     * 清空画布数据并复位内部状态。
     */
    clearCanvas() {
      if (!this.nodeCount) return;
      this.$lf.clearData();
      this.nodeSequence = [];
      this.selectedNodeId = null;
      this.emitSelection();
      this.updateGraphStats();
      this.$emit(EVENTS.CANVAS_CLEAR);
    },
    /**
     * 应用编辑 / 只读状态：同步拖动权限与节点、连线的命中态。
     * @param {boolean} editable 是否可编辑。
     */
    applyEditable(editable) {
      this.editable = editable;
      // 拖动权限 = 编辑态 && draggable，对节点、边同时生效。
      this.$lf.updateEditConfig({
        adjustNodePosition: this.draggableEnabled,
        adjustEdge: this.draggableEnabled,
      });
      this.setNodesHitable(this.nodeHitable);
      this.setEdgesHitable();
      // 节点不可命中时清空已有选中态。
      if (!this.nodeHitable) this.clearNodeSelection();
    },
    /**
     * 切换编辑 / 只读，并经 `update:readonly` 回传父级。
     */
    toggleEditable() {
      const editable = !this.editable;
      this.applyEditable(editable);
      this.$emit(EVENTS.UPDATE_READONLY, !editable);
    },
    /**
     * 批量设置所有节点的命中态。
     * @param {boolean} hitable 是否可命中（点击 / 拖动）。
     */
    setNodesHitable(hitable) {
      this.$lf.getGraphData().nodes.forEach((node) => {
        const model = this.$lf.getNodeModelById(node.id);
        if (model) model.setHitable(hitable);
      });
    },
    /**
     * 缩放画布以适配全部内容（四周留 80px 边距）。
     */
    fitView() {
      this.$lf.fitView(80, 80);
    },
    /**
     * 将当前图数据格式化为 JSON 并经 `export` 事件抛出。
     */
    exportGraph() {
      this.$emit(EVENTS.EXPORT, JSON.stringify(this.$lf.getGraphData(), null, 2));
    },
    /**
     * 连接两个节点；存在同向连线或自连时跳过。
     * @param {string} sourceNodeId 源节点 id。
     * @param {string} targetNodeId 目标节点 id。
     */
    connectNodes(sourceNodeId, targetNodeId) {
      const hasSameEdge = this.$lf
        .getGraphData()
        .edges.some((edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId);

      if (hasSameEdge || sourceNodeId === targetNodeId) return;
      const edge = this.$lf.addEdge({
        id: `edge-${this.nextEdgeIndex}`,
        type: 'polyline',
        sourceNodeId,
        targetNodeId,
      });
      this.nextEdgeIndex += 1;
      this.setEdgeHitable(edge.id);
    },
    /**
     * 返回 `nodeSequence` 中仍存在且最靠后的节点，作为新增节点的落点。
     * @returns {object | undefined} 末节点模型，画布为空时为 undefined。
     */
    getLastNode() {
      const nodes = this.$lf.getGraphData().nodes;
      const nodeIds = new Set(nodes.map((node) => node.id));
      const lastNodeId = [...this.nodeSequence].reverse().find((nodeId) => nodeIds.has(nodeId));
      return nodes.find((node) => node.id === lastNodeId);
    },
    /**
     * 设置单条连线的命中态（可拖动才可命中）。
     * @param {string} edgeId 连线 id。
     */
    setEdgeHitable(edgeId) {
      const edge = this.$lf.getEdgeModelById(edgeId);
      if (edge) edge.setHitable(this.draggableEnabled);
    },
    /**
     * 批量同步所有连线的命中态。
     */
    setEdgesHitable() {
      this.$lf.getGraphData().edges.forEach((edge) => this.setEdgeHitable(edge.id));
    },
    /**
     * 清空画布与组件内的选中态。
     */
    clearNodeSelection() {
      this.$lf.clearSelectElements();
      this.selectedNodeId = null;
      this.emitSelection();
    },
    /**
     * 取节点文本，兼容字符串与 `{ value }` 两种形态。
     * @param {object} node 节点数据。
     * @returns {string} 节点文本。
     */
    getNodeText(node) {
      return typeof node.text === 'string' ? node.text : node.text.value;
    },
    /**
     * 刷新选中节点文本并经 `selection-change` 抛出选中信息。
     */
    emitSelection() {
      const node = this.selectedNodeId
        ? this.$lf.getGraphData().nodes.find((item) => item.id === this.selectedNodeId)
        : null;
      this.selectedNodeLabel = node ? this.getNodeText(node) : '未选择节点';
      this.$emit(EVENTS.SELECTION_CHANGE, node ? { id: node.id, label: this.selectedNodeLabel } : null);
    },
    /**
     * 更新选中节点文本（由 `sidebar` 插槽回调触发）。
     * @param {string} label 新文本。
     */
    updateSelectedNodeLabel(label) {
      if (!this.selectedNodeId) return;
      const value = typeof label === 'string' ? label : String(label);
      this.$lf.updateText(this.selectedNodeId, value);
      this.selectedNodeLabel = value;
      this.$emit(EVENTS.SELECTION_CHANGE, { id: this.selectedNodeId, label: value });
    },
    /**
     * 重新统计节点 / 连线数量，并经 `graph-change` 事件把原始图数据与转换后图数据抛出。
     */
    updateGraphStats() {
      const rawData = this.$lf.getGraphRawData();
      const data = this.$lf.getGraphData();
      this.nodeCount = rawData.nodes.length;
      this.edgeCount = rawData.edges.length;
      this.$emit(EVENTS.GRAPH_CHANGE, { rawData, data });
      console.log({ rawData, data });
    },
  },
});
</script>
