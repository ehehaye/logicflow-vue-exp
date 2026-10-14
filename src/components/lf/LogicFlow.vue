<template>
  <div>
    <template v-if="lf">
      <LoginFlowContext :lf="lf">
        <slot></slot>
      </LoginFlowContext>
    </template>
    <div
      v-if="!teleport"
      ref="container"
      class="tw-w-full tw-h-[720px]"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import '@logicflow/core/dist/index.css';
import { Dagre } from '@logicflow/layout';
import { LogicFlow } from './model.js';
import LoginFlowContext from './LoginFlowContext.vue';

// LogicFlow 默认配置：关闭编辑态相关交互，仅保留只读浏览能力。
const DEFAULT_OPTIONS = {
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
  adjustNodePosition: false,
  adjustEdgeStartAndEnd: false,
  history: false,
};

// Dagre 自动布局参数，详见 http://logicflow.cn/tutorial/extension/layout
const DAGRE_LAYOUT_OPTIONS = {
  ranker: 'network-simplex',
  rankdir: 'TB', // 从上到下的布局方向
  nodesep: 60, // 节点间距
  ranksep: 70, // 层级间距
};

export default defineComponent({
  name: 'LogicFlow',
  props: {
    options: {
      type: Object,
      default: () => ({}),
    },
    graphData: {
      type: Object,
      default: () => ({}),
    },
    teleport: {
      type: String,
      default: '',
    },
  },
  components: {
    LoginFlowContext,
  },
  emits: ['ready'],
  data() {
    return {
      lf: null,
    };
  },
  mounted() {
    const container = this.resolveContainer();

    this.lf = this.createLogicFlow(container);
    this.setupAutoLayout();
    this.setupResizeObserver(container);
    this.setupWatchers();
    this.lf.fitView();

    this.$emit('ready', {
      lf: this.lf,
      graphModel: this.lf.graphModel,
    });
  },
  beforeDestroy() {
    this.resizeObserver?.disconnect();
    this.lf?.destroy();
  },
  methods: {
    /**
     * 解析 LogicFlow 挂载容器：优先使用 teleport 指定的外部容器，否则使用模板 ref。
     * @returns {HTMLElement}
     */
    resolveContainer() {
      return this.teleport ? document.querySelector(this.teleport) : this.$refs.container;
    },
    /**
     * 合并默认配置与外部传入的 options，options 优先级更高。
     * @returns {Object}
     */
    mergeOptions() {
      return {
        ...DEFAULT_OPTIONS,
        ...this.options,
      };
    },
    /**
     * 创建 LogicFlow 实例。
     * @param {HTMLElement} container 挂载容器。
     * @returns {LogicFlow}
     */
    createLogicFlow(container) {
      return new LogicFlow({
        container,
        plugins: [Dagre],
        ...this.mergeOptions(),
      });
    },
    /**
     * 包装实例的 fitView：先执行 Dagre 自动布局，再适配画布。
     * 保持对 lf 实例方法的覆盖，供工具栏等外部通过 lf.fitView() 触发布局。
     */
    setupAutoLayout() {
      const originalFitView = this.lf.fitView;
      this.lf.fitView = (event) => {
        requestAnimationFrame(() => {
          this.lf.extension.dagre.layout({ ...DAGRE_LAYOUT_OPTIONS });
          originalFitView.call(this.lf, event);
        });
      };
    },
    /**
     * 监听容器尺寸变化，尺寸改变时重新适配画布。
     * @param {HTMLElement} container 被观察的容器。
     */
    setupResizeObserver(container) {
      // resizeObserver 为内部句柄，无需响应式，故不放进 data。
      this.resizeObserver = new ResizeObserver(() => this.lf.fitView());
      this.resizeObserver.observe(container);
    },
    /**
     * 监听 graphData 与 options 变化，同步重新渲染与编辑配置。
     */
    setupWatchers() {
      this.$watch(
        () => this.graphData,
        () => {
          this.lf.render(this.graphData);
          this.lf.fitView();
        },
        { immediate: true, deep: true },
      );

      this.$watch(
        () => this.options,
        () => this.lf.updateEditConfig(this.mergeOptions()),
        { deep: true },
      );
    },
  },
});
</script>
