import StepEdge, { STEP_EDGE_TYPE } from './StepEdge.js';

/**
 * 所有自定义边注册配置的统一出口。
 * 新增自定义边时，在此导入并追加到 edges 数组即可。
 */
const edges = [StepEdge];

/**
 * 将所有自定义边统一注册到指定 LogicFlow 实例。
 * @param {import('@logicflow/core').default} lf LogicFlow 实例。
 */
export function registerEdges(lf) {
  edges.forEach((edge) => lf.register(edge));
}

export { StepEdge, STEP_EDGE_TYPE };
export default edges;
