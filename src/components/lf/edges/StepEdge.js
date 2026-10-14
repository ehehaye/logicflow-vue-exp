import { PolylineEdge, PolylineEdgeModel } from '@logicflow/core';

export const STEP_EDGE_TYPE = 'step-edge';

class StepEdgeModel extends PolylineEdgeModel {
  setAttributes() {
    super.setAttributes();
    // 边不对用户操作（点击/悬停等）进行反应，仅作连线展示
    this.isHitable = false;
  }
}

class StepEdgeView extends PolylineEdge {}

export default {
  type: STEP_EDGE_TYPE,
  view: StepEdgeView,
  model: StepEdgeModel,
};
