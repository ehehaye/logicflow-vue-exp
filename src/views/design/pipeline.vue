<template>
  <main class="tw-min-h-screen tw-p-7">
    <div
      class="tw-grid tw-grid-cols-flow-editor tw-min-h-flow-panel tw-overflow-hidden tw-bg-white tw-border tw-border-[#dfe5f0] tw-rounded-2xl tw-shadow-panel tw-max-w-[1440px] tw-mx-auto"
    >
      <LogicFlow :graph-data.sync="graphData">
        <Pipeline
          @select="onSelect"
          @node-add="onNodeAdd"
          @node-delete="onNodeDelete"
          @canvas-clear="onCanvasClear"
        />
      </LogicFlow>
      <aside class="tw-flex tw-flex-col tw-gap-3 tw-py-6 tw-px-[18px] tw-bg-[#f8faff] tw-border-l tw-border-[#e3e8f1]">
        <div class="tw-p-[14px] tw-bg-white tw-border tw-border-[#e0e6f0] tw-rounded-[10px]">
          <p class="tw-text-[11px] tw-font-extrabold tw-tracking-[.12em] tw-text-[#7d8aa6]">当前选择</p>
          <template v-if="node">
            <el-input
              :value="node.text.value"
              class="tw-mt-[7px]"
              @input="node.updateText($event)"
            />
            <el-input
              :value="node.properties.test"
              class="tw-mt-[7px]"
              @input="node.setProperties({ test: $event })"
            />
          </template>

          <small
            v-else
            class="tw-block tw-mt-[5px] tw-text-xs tw-leading-[1.5] tw-text-[#8190a9]"
          >
            请先在画布中选择一个节点。
          </small>
          <button
            class="tw-mt-3 tw-w-full tw-rounded-lg tw-border tw-border-[#e0e6f0] tw-bg-[#f8faff] tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-[#5a6b8c] tw-transition-colors hover:tw-border-[#c8d4f0] hover:tw-bg-[#eef3ff]"
            @click="onInspect"
          >
            inspect data
          </button>
        </div>
      </aside>
    </div>
  </main>
</template>

<script>
import _ from 'lodash';
import { defineComponent } from 'vue';
import LogicFlow from '@/components/lf/LogicFlow.vue';
import Pipeline from '@/components/lf/scenes/pipeline/index.vue';
import { toGraphData, toRawData } from '@/components/lf/scenes/pipeline/transform.js';

// 业务方提供的原始节点数据：只关心节点文案，id / 类型 / 坐标 / 连线由 transform.js 补齐。
const INITIAL_RAW_DATA = [{ text: '开始', test: '11' }, { text: '处理订单' }];

export default defineComponent({
  components: {
    LogicFlow,
    Pipeline,
  },
  data() {
    return {
      rawData: INITIAL_RAW_DATA,
      graphData: toGraphData(INITIAL_RAW_DATA),
      /** @type {import('@logicflow/core').BaseNodeModel} */
      node: null,
    };
  },
  methods: {
    onSelect(node) {
      this.node = node;
    },
    onNodeAdd(data) {
      console.log('[node-add]', data);
    },
    onNodeDelete(data) {
      console.log('[node-delete]', data);
    },
    onCanvasClear() {
      console.log('[canvas-clear]');
    },
    onInspect() {
      const { graphData } = this;
      const rawData = toRawData(this.graphData);
      console.log(
        '[inspect]',
        _.cloneDeep({
          graphData,
          rawData,
        }),
      );
    },
  },
});
</script>
