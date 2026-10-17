<template>
  <div class="tw-flex tw-w-full tw-flex-row tw-h-full">
    <LogicFlow @update:graphData="graphData = $event">
      <PipelineClassic />
    </LogicFlow>

    <aside class="inspector tw-overflow-y-auto">
      <div class="inspector__card">
        <div class="tw-flex tw-items-center tw-justify-between">
          <p class="inspector__eyebrow">画布数据</p>
          <span class="inspector__step-badge">{{ graphData.nodes.length }} 节点</span>
        </div>
        <p class="inspector__hint">事件驱动模式下，数据由画布事件维护并同步回当前组件</p>
      </div>

      <div class="inspector__card">
        <p class="inspector__eyebrow">图数据 JSON</p>
        <p class="inspector__hint">LogicFlow 维护的 graphData（nodes / edges）</p>
        <CodePreviewer
          class="tw-mt-3"
          title="graphData"
          language="json"
          :max-height="320"
          :code="graphDataJson"
        />
      </div>
    </aside>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import LogicFlow from '@/components/lf/LogicFlow.vue';
import PipelineClassic from '@/components/lf/scenes/PipelineClassic.vue';
import CodePreviewer from '@/components/common/CodePreviewer.vue';

export default defineComponent({
  name: 'ClassicView',
  components: {
    LogicFlow,
    PipelineClassic,
    CodePreviewer,
  },
  data() {
    return {
      graphData: {
        nodes: [],
        edges: [],
      },
    };
  },
  computed: {
    /** 图数据 graphData 的 JSON 文本，供 CodePreviewer 高亮展示 */
    graphDataJson() {
      return JSON.stringify(this.graphData, null, 2);
    },
  },
});
</script>
