/**
 * 画布内部自定义事件常量。
 * 场景组件通过 `graphModel.eventCenter` 冒泡，LogicFlow 封装层负责监听并向外同步。
 */
export const CenterEvents = Object.freeze({
  /** 图数据（节点 / 边结构或属性）发生变更 */
  GRAPH_DATA_UPDATE: 'graph-data-update',
});
