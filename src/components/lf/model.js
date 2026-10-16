import LogicFlow from '@logicflow/core';
import { reactive } from 'vue';

/**
 * 增强版 LogicFlow 实例。
 * 构造时将 graphModel 包装为 Vue 响应式对象，
 * 使场景组件可以通过 computed / watch 直接依赖节点、选中态等图状态。
 */
class LogicFlowPro extends LogicFlow {
  constructor(options) {
    super(options);
    reactive(this.graphModel);
  }

  /**
   * 获取当前图中没有出边的末节点（取最后一个，兼容分叉场景）。
   * @returns {import('@logicflow/core').BaseNodeModel | null}
   */
  getLastNode() {
    const leafNodes = this.graphModel.nodes.filter((node) => this.getNodeOutgoingEdge(node.id).length === 0);
    return leafNodes.length ? leafNodes[leafNodes.length - 1] : null;
  }
}

export { LogicFlowPro as LogicFlow };
