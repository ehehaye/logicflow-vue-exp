<template>
  <div
    class="tw-flex tw-justify-between tw-py-[14px] tw-px-5 tw-text-xs tw-text-[#71809a] tw-bg-white tw-border-b tw-border-[#e8edf5]"
  >
    <div class="flow-toolbar tw-flex tw-items-center tw-gap-[10px]">
      <el-dropdown
        split-button
        type="primary"
        trigger="click"
        v-if="!graphModel.editConfigModel.isSilentMode"
        @click="() => createNode('append')"
        @command="createNode"
      >
        新增节点
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            command="before"
            :disabled="!selectedNode"
          >
            到选中节点前
          </el-dropdown-item>
          <el-dropdown-item
            command="after"
            :disabled="!selectedNode"
          >
            到选中节点后
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <el-button
        v-if="graphModel.selectNodes.length"
        type="danger"
        @click="deleteSelectedNode"
      >
        删除选中节点
      </el-button>
      <el-button @click="() => lf.fitView()"> 适应画布 </el-button>
      <el-button
        @click="clearCanvas"
        v-show="graphModel.nodes.length"
      >
        清空画布
      </el-button>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { uuid } from '@/utils';
import { CenterEvents } from '@/components/lf/events';
import { LogicFlow } from '@/components/lf/model';
import { VERTICAL_GAP, DEFAULT_X, DEFAULT_Y, NODE_TYPE, EDGE_TYPE } from './transform';

const EVENTS = {
  SELECT: 'select',
  NODE_ADD: 'node-add',
  NODE_DELETE: 'node-delete',
  CANVAS_CLEAR: 'canvas-clear',
};

export default defineComponent({
  name: 'Pipeline',
  inject: ['injectLf', 'injectGraphModel'],
  props: {
    defaultText: {
      type: String,
      default: '步骤',
    },
  },
  emits: Object.values(EVENTS),
  data() {
    return {
      /** @type {LogicFlow} */
      lf: this.injectLf(),
      /** @type {import('@logicflow/core').GraphModel} */
      graphModel: this.injectGraphModel(),
    };
  },
  computed: {
    selectedNode() {
      return this.graphModel?.selectNodes[0];
    },
    selectedNodeId() {
      return this.selectedNode?.getData()?.id;
    },
  },
  watch: {
    selectedNode(next, prev) {
      // 选中新节点
      if (next) {
        return this.emit(EVENTS.SELECT, next);
      }

      // 选中画布，再次选中之前节点（若存在）
      if (prev && this.lf.getNodeModelById(prev.id)) {
        return this.lf.selectElementById(prev.id);
      }

      // 无选中节点
      return this.emit(EVENTS.SELECT, null);
    },
  },
  methods: {
    /**
     * 统一事件出口：转发事件载荷，并在需要时通过 eventCenter 冒泡图数据变更事件。
     * @param {string} event 事件名。
     * @param {*} payload 事件载荷。
     * @param {boolean} updateGraphData 是否同时冒泡图数据变更事件。
     */
    emit(event, payload, updateGraphData = false) {
      this.$emit(event, payload);
      if (updateGraphData) {
        this.graphModel.eventCenter.emit(CenterEvents.GRAPH_DATA_UPDATE, this.lf.getGraphData());
      }
    },
    /**
     * 新增节点：默认追加到末节点下方；有选中节点时支持前插 / 后插。
     * @param {'append' | 'before' | 'after'} position 插入位置，默认 'append'。
     */
    createNode(position = 'append') {
      this.nextNodeIndex += 1;
      const nodeId = `node-${uuid()}`;
      const text = this.defaultText;

      if (this.selectedNode && (position === 'before' || position === 'after')) {
        this.insertNodeRelativeToSelected(nodeId, text, position);
      } else {
        this.appendNode(nodeId, text);
      }

      this.lf.selectElementById(nodeId, false);
      const node = this.lf.getNodeModelById(nodeId);
      this.emit(EVENTS.NODE_ADD, node, true);
      this.lf.fitView();
    },
    /**
     * 在末节点下方追加节点并自动连线。
     */
    appendNode(nodeId, text) {
      const tail = this.lf.getLastNode();
      this.lf.addNode({
        id: nodeId,
        type: NODE_TYPE,
        x: tail ? tail.x : DEFAULT_X,
        y: tail ? tail.y + VERTICAL_GAP : DEFAULT_Y,
        text,
      });

      if (tail) this.connectNodes(tail.id, nodeId);
    },
    /**
     * 在选中节点前 / 后插入节点：腾出槽位并重定向相关连线。
     */
    insertNodeRelativeToSelected(nodeId, text, direction) {
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
      // 交叉配对：每个上游 × 每个下游，保证删除后图仍连通。
      incomingEdges.forEach(({ sourceNodeId }) => {
        outgoingEdges.forEach(({ targetNodeId }) => this.connectNodes(sourceNodeId, targetNodeId));
      });

      this.emit(EVENTS.NODE_DELETE, nodeId, true);
      this.lf.fitView();
    },
    /**
     * 连接两个节点；已存在同向连线或自连时跳过。
     */
    connectNodes(sourceNodeId, targetNodeId) {
      if (sourceNodeId === targetNodeId) return;

      const exists = this.lf
        .getGraphData()
        .edges.some((edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId);
      if (exists) return;

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
      this.emit(EVENTS.CANVAS_CLEAR, null, true);
    },
  },
});
</script>
