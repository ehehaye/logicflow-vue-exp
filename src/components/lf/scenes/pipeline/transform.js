import { uuid } from '@/utils';

export const DEFAULT_X = 430;
export const DEFAULT_Y = 130;
export const VERTICAL_GAP = 160;
export const NODE_TYPE = 'rect';

/**
 * 将业务方提供的原始节点文案转换为 LogicFlow 图数据：
 * 按索引补齐 id / 类型 / 坐标，并自动串联为 polyline 边。
 * @param {{ text: string }[]} rawData
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function toGraphData(rawData) {
  const nodes = rawData.map(({ text }, index) => ({
    id: `node-${uuid()}`,
    type: NODE_TYPE,
    x: DEFAULT_X,
    y: DEFAULT_Y + index * VERTICAL_GAP,
    text,
  }));

  const edges = nodes.slice(1).map((node, index) => ({
    id: `edge-${uuid()}`,
    type: 'polyline',
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
  return graphData.nodes.map(({ text }) => ({ text: typeof text === 'string' ? text : text.value }));
}
