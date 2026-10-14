import StepNode, { STEP_NODE_TYPE } from './StepNode.js';

/**
 * 所有自定义节点注册配置的统一出口。
 * 新增自定义节点时，在此导入并追加到 nodes 数组即可。
 */
const nodes = [StepNode];

/**
 * 将所有自定义节点统一注册到指定 LogicFlow 实例。
 * @param {import('@logicflow/core').default} lf LogicFlow 实例。
 */
export function registerNodes(lf) {
  nodes.forEach((node) => lf.register(node));
}

export { StepNode, STEP_NODE_TYPE };
export default nodes;
