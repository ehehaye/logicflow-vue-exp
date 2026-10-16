<script>
/**
 * 数据驱动的流水线编排画布场景。
 * 对外只暴露业务层 nodes 数据（.sync），无需接触 LogicFlow 底层数据；
 * 图结构由 nodes 派生，所有变更通过 watch nodes 同步到画布。
 *
 * 注意：本组件无独立模板，通过 mixin 复用 PipelineClassic 的工具栏模板与选中逻辑。
 */
import _ from 'lodash';
import { defineComponent } from 'vue';
import { uuid } from '@/utils';
import PipelineClassic, { DEFAULT_X, DEFAULT_Y, VERTICAL_GAP, NODE_TYPE, EDGE_TYPE } from './PipelineClassic.vue';

export default defineComponent({
  name: 'PipelineReactive',
  mixins: [PipelineClassic],
  props: {
    /** 业务侧节点列表，支持 .sync 双向同步 */
    nodes: {
      type: Array,
      default: () => [],
    },
    /** 新节点工厂函数，返回业务节点对象（可带 id / text / 其他属性） */
    nodeFactory: {
      type: Function,
      default: () => ({ text: '节点' }),
    },
  },
  emits: ['update:nodes'],
  data() {
    return {
      /** 业务节点对象 → 图节点 id 的映射（原始数据无 id 时兜底） */
      nodeIdMap: new WeakMap(),
      /** 上一轮 nodes 快照，用于 diff 属性级变更 */
      previousNodes: [],
    };
  },
  watch: {
    nodes: {
      handler(next) {
        const prev = this.previousNodes;

        if (next.length === prev.length) {
          // 节点数量未变：按属性 diff 做增量更新
          this.syncNodeProperties(next, prev);
        } else {
          // 节点数量变更：全量重新渲染并调整布局
          this.render();
        }
        this.previousNodes = _.cloneDeep(next);
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    /**
     * 将 nodes 中的属性变更增量同步到画布；
     * 遇到无法定位 id 的节点时回退为全量渲染。
     */
    syncNodeProperties(next, prev) {
      const changedNodes = _.differenceWith(next, prev, _.isEqual);
      let needFullRender = false;

      changedNodes.forEach((node) => {
        const { text, id = this.getNodeId(node), ...properties } = node;
        if (!id) {
          needFullRender = true;
          return;
        }
        if (text !== undefined) this.lf.updateText(id, text);
        this.lf.setProperties(id, properties);
      });

      if (needFullRender) this.render();
    },
    /**
     * 按当前 nodes 全量重绘画布并自动布局。
     */
    render() {
      this.lf.render(this.toGraphData(this.nodes));
      this.lf.fitView();
    },
    /**
     * 解析业务节点对应的图节点 id：
     * 优先使用原始数据自带的 id，否则取初始化时记录的映射。
     */
    getNodeId(node) {
      if (node.id) return node.id;
      if (this.nodeIdMap.has(node)) return this.nodeIdMap.get(node);
      return '';
    },
    /**
     * 将业务方提供的原始节点列表转换为 LogicFlow 图数据：
     * 按索引补齐 id / 类型 / 坐标，并依次串联为 step-edge 边。
     * @param {Array<{ text?: string, id?: string }>} rawNodes 原始节点列表。
     * @returns {{ nodes: object[], edges: object[] }}
     */
    toGraphData(rawNodes) {
      const nodes = rawNodes.map((node, index) => {
        const { text, id = `node-${uuid()}`, ...properties } = node;
        this.nodeIdMap.set(node, id);
        return {
          id,
          type: NODE_TYPE,
          x: DEFAULT_X,
          y: DEFAULT_Y + index * VERTICAL_GAP,
          text,
          properties,
        };
      });

      const edges = nodes.slice(1).map((node, index) => ({
        id: `edge-for-${node.id}`,
        type: EDGE_TYPE,
        sourceNodeId: nodes[index].id,
        targetNodeId: node.id,
      }));

      return { nodes, edges };
    },
    /**
     * 新增节点：默认追加到末尾；有选中节点时支持前插 / 后插。
     * @param {'append' | 'before' | 'after'} position 插入位置，默认 'append'。
     */
    createNode(position = 'append') {
      const node = this.nodeFactory();
      this.nodeIdMap.set(node, node.id || `node-${uuid()}`);

      const nextNodes = [...this.nodes];
      if (position === 'before') {
        nextNodes.splice(this.selectedNodeIndex, 0, node);
      } else if (position === 'after') {
        nextNodes.splice(this.selectedNodeIndex + 1, 0, node);
      } else {
        nextNodes.push(node);
      }
      this.$emit('update:nodes', nextNodes);

      this.$nextTick(() => {
        this.lf.selectElementById(this.getNodeId(node));
      });
    },
    /**
     * 删除选中节点：同步移除业务数据，图结构由 watch 联动重绘。
     */
    deleteSelectedNode() {
      const nextNodes = [...this.nodes];
      nextNodes.splice(this.selectedNodeIndex, 1);
      this.$emit('update:nodes', nextNodes);
    },
    /**
     * 清空画布。
     */
    clearCanvas() {
      this.$emit('update:nodes', []);
    },
  },
});
</script>
