<template>
  <div class="tw-flex tw-w-full tw-flex-row tw-h-full">
    <LogicFlow>
      <PipelineReactive
        :nodes.sync="nodes"
        @select="({ index }) => (activeIndex = index)"
      />
    </LogicFlow>

    <aside class="inspector tw-overflow-y-auto">
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

      <div class="inspector__card">
        <p class="inspector__eyebrow">业务数据 JSON</p>
        <p class="inspector__hint">当前组件维护的 nodes 数据</p>
        <CodePreviewer
          class="tw-mt-3"
          title="nodes"
          language="json"
          :max-height="320"
          :code="nodesJson"
        />
      </div>
    </aside>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import LogicFlow from '@/components/lf/LogicFlow.vue';
import PipelineReactive from '@/components/lf/scenes/PipelineReactive.vue';
import CodePreviewer from '@/components/common/CodePreviewer.vue';

/**
 * 初始业务节点数据工厂（text 之外的字段作为 properties 透传给画布节点）。
 * 每次进入视图时重新生成，避免动态组件重建后复用被 v-model 改过的模块级数组。
 */
const createInitialNodes = () => [
  { id: 'step-checkout', text: '拉取代码', status: 'success', owner: 'ci-bot' },
  { id: 'step-install', text: '安装依赖', status: 'success', owner: 'ci-bot' },
  { id: 'step-build', text: '构建产物', status: 'running', owner: 'ci-bot' },
  { id: 'step-test', text: '运行测试', status: 'pending', owner: 'qa-bot' },
  { id: 'step-deploy', text: '部署上线', status: 'pending', owner: 'release-bot' },
];

export default defineComponent({
  name: 'ReactiveView',
  components: {
    LogicFlow,
    PipelineReactive,
    CodePreviewer,
  },
  data() {
    return {
      nodes: createInitialNodes(),
      activeIndex: -1,
    };
  },
  computed: {
    /** 当前选中的业务节点，未选中时为 null */
    node() {
      return this.activeIndex === -1 ? null : this.nodes[this.activeIndex];
    },
    /** 业务数据 nodes 的 JSON 文本，供 CodePreviewer 高亮展示 */
    nodesJson() {
      return JSON.stringify(this.nodes, null, 2);
    },
  },
});
</script>
