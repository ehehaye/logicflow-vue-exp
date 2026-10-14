import LogicFlow from '@logicflow/core';
import { reactive } from 'vue';

class LogicFlowWithInterceptor extends LogicFlow {
  constructor(options) {
    super(options);
    reactive(this.graphModel);
  }

  getLastNode() {
    const nodes = this.graphModel.nodes.filter((n) => this.getNodeOutgoingEdge(n.id).length === 0);
    return nodes.length ? nodes[nodes.length - 1] : null;
  }
}

export { LogicFlowWithInterceptor as LogicFlow };
