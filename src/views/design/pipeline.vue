<template>
  <main class="tw-min-h-screen tw-p-7">
    <div
      class="tw-grid tw-grid-cols-flow-editor tw-min-h-flow-panel tw-overflow-hidden tw-bg-white tw-border tw-border-[#dfe5f0] tw-rounded-2xl tw-shadow-panel tw-max-w-[1440px] tw-mx-auto"
    >
      <LogicFlow :graph-data="graphData">
        <Pipeline
          ref="pipeline"
          @select="onSelect"
          @node-add="onNodeAdd"
          @node-delete="onNodeDelete"
          @node-update="onNodeUpdate"
          @canvas-clear="onCanvasClear"
        />
      </LogicFlow>
      <NodeEditor
        :node="selectedNode"
        @update="onUpdateNode"
      />
    </div>
  </main>
</template>

<script>
import { defineComponent } from 'vue';
import LogicFlow from '@/components/lf/LogicFlow.vue';
import Pipeline from '@/components/lf/scenes/pipeline/index.vue';
import NodeEditor from '@/views/design/modules/NodeEditor.vue';

// 初始流水线数据：由业务方提供，场景组件只负责编排，不关心业务内容。
const INITIAL_GRAPH_DATA = {
  nodes: [
    { id: 'start', type: 'circle', x: 430, y: 130, text: '开始' },
    { id: 'task', type: 'rect', x: 430, y: 290, text: '处理订单' },
  ],
  edges: [{ id: 'start-to-task', type: 'polyline', sourceNodeId: 'start', targetNodeId: 'task' }],
};

export default defineComponent({
  components: {
    LogicFlow,
    Pipeline,
    NodeEditor,
  },
  data() {
    return {
      graphData: INITIAL_GRAPH_DATA,
      selectedNode: null,
    };
  },
  methods: {
    onSelect(node) {
      this.selectedNode = node;
    },
    onUpdateNode({ id, text }) {
      this.$refs.pipeline.updateNode(id, text);
    },
    onNodeAdd(data) {
      console.log('[node-add]', data);
    },
    onNodeDelete(data) {
      console.log('[node-delete]', data);
    },
    onNodeUpdate(data) {
      console.log('[node-update]', data);
    },
    onCanvasClear() {
      console.log('[canvas-clear]');
    },
  },
});
</script>
