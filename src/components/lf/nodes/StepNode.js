import { RectNode, RectNodeModel } from '@logicflow/core';

export const STEP_NODE_TYPE = 'step-node';

/** 节点圆角半径 */
const NODE_RADIUS = 8;

/** 节点配色：默认 / 悬停 / 选中 */
const NODE_COLORS = {
  fill: '#ffffff',
  stroke: '#c9d4e5',
  hoverStroke: '#2563eb',
  selectedFill: '#2563eb',
  selectedStroke: '#1e40af',
  text: '#1d2433',
  selectedText: '#ffffff',
};

class StepNodeModel extends RectNodeModel {
  setAttributes() {
    super.setAttributes();
    this.radius = NODE_RADIUS;
  }

  getNodeStyle() {
    const style = super.getNodeStyle();

    if (this.isSelected) {
      return {
        ...style,
        fill: NODE_COLORS.selectedFill,
        stroke: NODE_COLORS.selectedStroke,
      };
    }

    return {
      ...style,
      fill: NODE_COLORS.fill,
      stroke: this.isHovered ? NODE_COLORS.hoverStroke : NODE_COLORS.stroke,
    };
  }

  getTextStyle() {
    const style = {
      ...super.getTextStyle(),
      overflowMode: 'autoWarp',
    };

    if (this.isSelected) {
      return {
        ...style,
        fill: NODE_COLORS.selectedText, // overflowMode: default 时渲染生效
        color: NODE_COLORS.selectedText, // overflowMode: autoWarp 时渲染生效
      };
    }

    return {
      ...style,
      fill: NODE_COLORS.text,
      color: NODE_COLORS.text,
    };
  }
}

class StepNodeView extends RectNode {}

export default {
  type: STEP_NODE_TYPE,
  view: StepNodeView,
  model: StepNodeModel,
};
