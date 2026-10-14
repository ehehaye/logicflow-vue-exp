import _ from 'lodash';
import { uuid } from '@/utils';
import { STEP_NODE_TYPE } from '@/components/lf/nodes/index';
import { STEP_EDGE_TYPE } from '@/components/lf/edges/index';

export const DEFAULT_X = 430;
export const DEFAULT_Y = 130;
export const VERTICAL_GAP = 160;
export const NODE_TYPE = STEP_NODE_TYPE;
export const EDGE_TYPE = STEP_EDGE_TYPE;

/**
 * 将业务方提供的原始节点文案转换为 LogicFlow 图数据：
 * 按索引补齐 id / 类型 / 坐标，并自动串联为 step-edge 边。
 * @param {{ text: string }[]} rawData
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function toGraphData(rawData) {
  const nodes = rawData.map(({ text, ...properties }, index) => ({
    id: `node-${uuid()}`,
    type: NODE_TYPE,
    x: DEFAULT_X,
    y: DEFAULT_Y + index * VERTICAL_GAP,
    text,
    properties,
  }));

  const edges = nodes.slice(1).map((node, index) => ({
    id: `edge-${uuid()}`,
    type: STEP_EDGE_TYPE,
    sourceNodeId: nodes[index].id,
    targetNodeId: node.id,
  }));

  return { nodes, edges };
}

/**
 * toGraphData 的逆向：从图数据还原原始节点文案（只保留 text 字段）。
 * @param {{ nodes: object[] }} graphData
 * @returns {{ text: string }[]}
 */
export function toRawData(graphData) {
  return graphData.nodes.map(({ text, properties }) => ({
    text: typeof text === 'string' ? text : text.value,
    properties: _.omit(properties, ['width', 'height']),
  }));
}
