<template>
  <div class="tw-flex tw-w-full tw-flex-row tw-h-full">
    <LogicFlow>
      <PipelineReactive
        :nodes.sync="nodes"
        @select="({ index }) => (activeIndex = index)"
      />
    </LogicFlow>

    <aside class="inspector">
      <div class="inspector__card">
        <div class="tw-flex tw-items-center tw-justify-between">
          <p class="inspector__eyebrow">节点属性</p>
          <span
            v-if="node"
            class="inspector__step-badge"
          >
            STEP {{ activeIndex + 1 }}
          </span>
        </div>

        <template v-if="node">
          <label class="inspector__label">节点名称</label>
          <el-input
            v-model="node.text"
            size="small"
            placeholder="请输入节点名称"
          />
          <p class="inspector__hint">修改将实时同步到画布</p>
        </template>

        <div
          v-else
          class="inspector__empty"
        >
          <i class="el-icon-mouse" />
          <p>在画布中点击节点<br />即可查看与编辑属性</p>
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import LogicFlow from '@/components/lf/LogicFlow.vue';
import PipelineReactive from '@/components/lf/scenes/PipelineReactive.vue';

export default defineComponent({
  name: 'ReactiveView',
  components: {
    LogicFlow,
    PipelineReactive,
  },
  data() {
    return {
      nodes: [],
      activeIndex: -1,
    };
  },
  computed: {
    /** 当前选中的业务节点，未选中时为 null */
    node() {
      return this.activeIndex === -1 ? null : this.nodes[this.activeIndex];
    },
  },
});
</script>
