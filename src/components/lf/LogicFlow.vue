<template>
  <div class="tw-flex tw-h-full tw-w-full tw-flex-col">
    <LogicFlowContext
      v-if="initialized"
      :lf="lf"
    >
      <slot></slot>
    </LogicFlowContext>
    <div
      v-if="!teleport"
      class="tw-flex tw-w-full tw-flex-1"
      :style="{ minHeight: '600px' }"
    >
      <div
        ref="container"
        class="tw-w-full tw-flex-1 tw-overflow-hidden"
      />
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import { defineComponent } from 'vue';
import '@logicflow/core/dist/index.css';
import { Dagre } from '@logicflow/layout';
import { Control } from '@logicflow/extension';
import '@logicflow/extension/lib/style/index.css';
import LogicFlowContext from './LogicFlowContext.vue';
import { CenterEvents } from '@/components/lf/events';
import { LogicFlow } from './model';
import { registerEdges } from './edges';
import { registerNodes } from './nodes';

/** LogicFlow 默认配置：关闭编辑态相关交互，仅保留只读浏览能力 */
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

/** Dagre 自动布局参数，详见 https://logicflow.cn/tutorial/extension/layout */
const DAGRE_LAYOUT_OPTIONS = {
  ranker: 'network-simplex',
  rankdir: 'TB', // 从上到下布局
  nodesep: 60, // 同层节点间距
  ranksep: 70, // 层与层间距
};

/** fitView 适配画布时预留的四周边距 */
const FIT_VIEW_VERTICAL_OFFSET = 120;
const FIT_VIEW_HORIZONTAL_OFFSET = 120;

/** 容器尺寸变化后重新适配画布的防抖间隔（ms） */
const RESIZE_DEBOUNCE_DELAY = 100;

export default defineComponent({
  name: 'LogicFlow',
  components: {
    LogicFlowContext,
  },
  props: {
    options: {
      type: Object,
      default: () => ({}),
    },
    graphData: {
      type: Object,
      default: () => ({}),
    },
    /** 外部容器选择器；指定后画布挂载到该容器，组件内不再渲染容器 */
    teleport: {
      type: String,
      default: '',
    },
  },
  emits: ['update:graphData'],
  data() {
    return {
      /** @type {import('./model').LogicFlow | null} */
      lf: null,
      initialized: false,
    };
  },
  mounted() {
    const container = this.resolveContainer();

    this.lf = this.createLogicFlow(container);
    // control plugins 需要在 render 前初始化
    this.setupPlugins();
    this.lf.once('graph:rendered', () => {
      this.setupAutoLayout();
      this.setupResizeObserver(container);
      this.setupWatchers();
      this.setupGraphDataEvents();
      this.initialized = true;
    });
    this.lf.render();
  },
  beforeDestroy() {
    this.resizeObserver?.disconnect();
    this.lf?.destroy();
  },
  methods: {
    /**
     * 监听图数据变化事件，向外同步最新的 graphData。
     */
    setupGraphDataEvents() {
      const emitGraphData = () => {
        this.$emit('update:graphData', _.cloneDeep(this.lf.getGraphData()));
      };
      this.lf.on(CenterEvents.GRAPH_DATA_UPDATE, emitGraphData);
      this.lf.on('node:properties-change', emitGraphData);
    },
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
     * 创建 LogicFlow 实例并注册自定义节点与边。
     * @param {HTMLElement} container 挂载容器。
     * @returns {import('./model').LogicFlow}
     */
    createLogicFlow(container) {
      const lf = new LogicFlow({
        container,
        plugins: [Dagre, Control],
        ...this.mergeOptions(),
      });
      registerNodes(lf);
      registerEdges(lf);
      return lf;
    },
    /**
     * 包装实例的 fitView：先执行 Dagre 自动布局，再适配画布。
     * 保持对 lf 实例方法的覆盖，供工具栏等外部通过 lf.fitView() 触发布局。
     */
    setupAutoLayout() {
      const originalFitView = this.lf.fitView;
      this.lf.fitView = () => {
        requestAnimationFrame(() => {
          const selectedIds = [...this.lf.graphModel.selectElements.keys()];
          this.lf.extension.dagre.layout({ ...DAGRE_LAYOUT_OPTIONS });
          originalFitView.call(this.lf, FIT_VIEW_VERTICAL_OFFSET, FIT_VIEW_HORIZONTAL_OFFSET);
          // dagre.layout 会清除选中状态，布局完成后恢复
          selectedIds.forEach((id) => this.lf.selectElementById(id, true));
        });
      };
    },
    /**
     * 监听容器尺寸变化，尺寸改变时重新适配画布。
     * @param {HTMLElement} container 被观察的容器。
     */
    setupResizeObserver(container) {
      const handleResize = _.debounce(() => {
        this.lf.fitView();
      }, RESIZE_DEBOUNCE_DELAY);
      this.resizeObserver = new ResizeObserver(handleResize);
      this.resizeObserver.observe(container);
    },
    setupPlugins() {
      this.lf.extension.control.removeItem('undo');
      this.lf.extension.control.removeItem('redo');
      this.lf.extension.control.removeItem('reset');
      this.lf.extension.control.addItem({
        key: 'reset',
        iconClass: 'lf-control-fit',
        text: '适应',
        onClick: () => {
          this.lf.fitView();
        },
      });
    },
    /**
     * 监听 graphData 与 options 变化，同步重新渲染与编辑配置。
     */
    setupWatchers() {
      this.$watch(
        () => this.graphData,
        (next) => {
          const currentGraphData = this.lf.getGraphData();
          if (_.isEqual(currentGraphData, next)) return;
          this.lf.render(next);
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
