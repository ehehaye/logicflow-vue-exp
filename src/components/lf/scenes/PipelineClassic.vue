<template>
  <div
    v-show="!graphModel.editConfigModel.isSilentMode"
    class="pipeline-toolbar"
  >
    <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
      <el-dropdown
        split-button
        type="primary"
        size="small"
        trigger="click"
        @click="() => createNode('append')"
        @command="createNode"
      >
        <span class="tw-inline-flex tw-items-center tw-gap-1"> <i class="el-icon-plus" />新增节点 </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            command="before"
            :disabled="!selectedNode"
          >
            插到选中节点前
          </el-dropdown-item>
          <el-dropdown-item
            command="after"
            :disabled="!selectedNode"
          >
            插到选中节点后
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>

      <el-divider direction="vertical" />

      <el-button
        v-show="graphModel.nodes.length"
        size="small"
        icon="el-icon-full-screen"
        @click="() => lf.fitView()"
      >
        适应屏幕
      </el-button>

      <el-popconfirm
        v-show="selectedNode"
        title="将删除选中节点，是否继续？"
        @onConfirm="deleteSelectedNode"
      >
        <template #reference>
          <el-button
            size="small"
            type="danger"
            plain
            icon="el-icon-remove-outline"
          >
            删除节点
          </el-button>
        </template>
      </el-popconfirm>

      <el-popconfirm
        v-show="graphModel.nodes.length"
        title="将删除所有节点，是否继续？"
        @onConfirm="clearCanvas"
      >
        <template #reference>
          <el-button
            size="small"
            type="danger"
            plain
            icon="el-icon-delete"
          >
            清空画布
          </el-button>
        </template>
      </el-popconfirm>
    </div>

    <span
      v-if="graphModel.nodes.length"
      class="tw-text-xs tw-text-[#9aa7bd]"
    >
      共 {{ graphModel.nodes.length }} 个节点
    </span>
  </div>
</template>

<script>
/**
 * 事件驱动的流水线编排画布场景。
 * 直接操作 LogicFlow 底层数据（节点 / 边模型），通过事件向外通知变更。
 */
import { defineComponent } from 'vue';
import { uuid } from '@/utils';
import { CenterEvents } from '@/components/lf/events';
import { STEP_NODE_TYPE } from '@/components/lf/nodes';
import { STEP_EDGE_TYPE } from '@/components/lf/edges';

/** 首个节点的默认坐标与节点间的垂直间距 */
export const DEFAULT_X = 430;
export const DEFAULT_Y = 130;
export const VERTICAL_GAP = 160;

/** 场景中使用的节点 / 边类型 */
export const NODE_TYPE = STEP_NODE_TYPE;
export const EDGE_TYPE = STEP_EDGE_TYPE;

/** 场景对外抛出的事件名 */
const EVENTS = Object.freeze({
  SELECT: 'select',
  NODE_ADD: 'node-add',
  NODE_DELETE: 'node-delete',
  CANVAS_CLEAR: 'canvas-clear',
});

export default defineComponent({
  name: 'PipelineClassic',
  inject: ['injectLf', 'injectGraphModel'],
  props: {
    /** 新节点的默认文案 */
    defaultText: {
      type: String,
      default: '节点',
    },
  },
  emits: Object.values(EVENTS),
  data() {
    return {
      /** @type {import('@/components/lf/model').LogicFlow} */
      lf: this.injectLf(),
      /** @type {import('@logicflow/core').GraphModel} */
      graphModel: this.injectGraphModel(),
    };
  },
  computed: {
    /** 当前选中的节点模型（单选场景，取第一个） */
    selectedNode() {
      return this.graphModel?.selectNodes[0];
    },
    selectedNodeId() {
      return this.selectedNode?.getData()?.id;
    },
    /** 选中节点在节点列表中的下标，未选中时为 -1 */
    selectedNodeIndex() {
      if (!this.selectedNode) return -1;
      return this.graphModel.nodes.indexOf(this.selectedNode);
    },
  },
  watch: {
    selectedNode(next, prev) {
      // 选中新节点
      if (next) {
        return this.emitSceneEvent(EVENTS.SELECT, { node: next, index: this.selectedNodeIndex });
      }

      // 点击画布空白处导致取消选中时，恢复之前的选中节点（若仍存在）
      if (prev && this.lf.getNodeModelById(prev.id)) {
        return this.lf.selectElementById(prev.id);
      }

      // 无选中节点
      return this.emitSceneEvent(EVENTS.SELECT, { node: null, index: -1 });
    },
  },
  methods: {
    /**
     * 统一事件出口：转发事件载荷，并在需要时通过 eventCenter 冒泡图数据变更事件。
     * @param {string} event 事件名。
     * @param {*} payload 事件载荷。
     * @param {boolean} [syncGraphData] 是否同时冒泡图数据变更事件。
     */
    emitSceneEvent(event, payload, syncGraphData = false) {
      this.$emit(event, payload);
      if (syncGraphData) {
        this.graphModel.eventCenter.emit(CenterEvents.GRAPH_DATA_UPDATE, this.lf.getGraphData());
      }
    },
    /**
     * 新增节点：默认追加到末节点下方；有选中节点时支持前插 / 后插。
     * @param {'append' | 'before' | 'after'} position 插入位置，默认 'append'。
     */
    createNode(position = 'append') {
      const nodeId = `node-${uuid()}`;
      const text = this.defaultText;

      if (this.selectedNode && (position === 'before' || position === 'after')) {
        this.insertNodeAroundSelected(nodeId, text, position);
      } else {
        this.appendNode(nodeId, text);
      }

      this.lf.selectElementById(nodeId, false);
      const node = this.lf.getNodeModelById(nodeId);
      this.emitSceneEvent(EVENTS.NODE_ADD, node, true);
      this.lf.fitView();
    },
    /**
     * 在末节点下方追加节点并自动连线。
     * @param {string} nodeId 新节点 id。
     * @param {string} text 节点文案。
     */
    appendNode(nodeId, text) {
      const tailNode = this.lf.getLastNode();
      this.lf.addNode({
        id: nodeId,
        type: NODE_TYPE,
        x: tailNode ? tailNode.x : DEFAULT_X,
        y: tailNode ? tailNode.y + VERTICAL_GAP : DEFAULT_Y,
        text,
      });

      if (tailNode) this.connectNodes(tailNode.id, nodeId);
    },
    /**
     * 在选中节点前 / 后插入节点：腾出槽位并重定向相关连线。
     * @param {string} nodeId 新节点 id。
     * @param {string} text 节点文案。
     * @param {'before' | 'after'} direction 插入方向。
     */
    insertNodeAroundSelected(nodeId, text, direction) {
      const { id: selectedId, x, y } = this.selectedNode;

      if (direction === 'before') {
        this.shiftSubtree(selectedId, VERTICAL_GAP);
        this.lf.addNode({ id: nodeId, type: NODE_TYPE, x, y, text });
        this.rewireIncomingEdges(selectedId, nodeId);
        this.connectNodes(nodeId, selectedId);
      } else {
        this.shiftDownstream(selectedId, VERTICAL_GAP);
        this.lf.addNode({ id: nodeId, type: NODE_TYPE, x, y: y + VERTICAL_GAP, text });
        this.rewireOutgoingEdges(selectedId, nodeId);
        this.connectNodes(selectedId, nodeId);
      }
    },
    /**
     * 把选中节点的入边重定向到新节点（上游 → 新节点）。
     */
    rewireIncomingEdges(selectedId, nodeId) {
      this.lf.getNodeIncomingEdge(selectedId).forEach((edge) => {
        const { id, sourceNodeId } = edge.getData();
        this.lf.deleteEdge(id);
        this.connectNodes(sourceNodeId, nodeId);
      });
    },
    /**
     * 把选中节点的出边重定向到新节点（新节点 → 原下游）。
     */
    rewireOutgoingEdges(selectedId, nodeId) {
      this.lf.getNodeOutgoingEdge(selectedId).forEach((edge) => {
        const { id, targetNodeId } = edge.getData();
        this.lf.deleteEdge(id);
        this.connectNodes(nodeId, targetNodeId);
      });
    },
    /**
     * 将选中节点的每个直接下游子树沿 y 轴下移。
     */
    shiftDownstream(selectedId, delta) {
      this.lf.getNodeOutgoingNode(selectedId).forEach((child) => this.shiftSubtree(child.id, delta));
    },
    /**
     * 将以 rootId 为根的子树（含自身）沿 y 轴整体平移 delta。
     */
    shiftSubtree(rootId, delta) {
      const visited = new Set();
      const queue = [rootId];

      while (queue.length) {
        const id = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);

        if (this.lf.getNodeModelById(id)) this.graphModel.moveNode(id, 0, delta, true);
        this.lf.getNodeOutgoingNode(id).forEach((child) => queue.push(child.id));
      }
    },
    /**
     * 删除选中节点：把其上游 × 下游交叉桥接，保持图连通。
     */
    deleteSelectedNode() {
      const nodeId = this.selectedNodeId;
      if (!nodeId) return;

      const incomingEdges = this.lf.getNodeIncomingEdge(nodeId).map((edge) => edge.getData());
      const outgoingEdges = this.lf.getNodeOutgoingEdge(nodeId).map((edge) => edge.getData());

      this.lf.deleteNode(nodeId);
      // 交叉配对：每个上游 × 每个下游，保证删除后图仍连通
      incomingEdges.forEach(({ sourceNodeId }) => {
        outgoingEdges.forEach(({ targetNodeId }) => this.connectNodes(sourceNodeId, targetNodeId));
      });

      this.emitSceneEvent(EVENTS.NODE_DELETE, nodeId, true);
      this.lf.fitView();
    },
    /**
     * 连接两个节点；已存在同向连线或自连时跳过。
     */
    connectNodes(sourceNodeId, targetNodeId) {
      if (sourceNodeId === targetNodeId) return;

      const alreadyConnected = this.lf
        .getGraphData()
        .edges.some((edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId);
      if (alreadyConnected) return;

      this.lf.addEdge({
        id: `edge-${uuid()}`,
        type: EDGE_TYPE,
        sourceNodeId,
        targetNodeId,
      });
    },
    /**
     * 清空画布，并冒泡 canvas-clear 事件。
     */
    clearCanvas() {
      this.lf.clearData();
      this.emitSceneEvent(EVENTS.CANVAS_CLEAR, null, true);
    },
  },
});
</script>
