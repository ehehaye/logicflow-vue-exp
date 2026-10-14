import { RectNode, RectNodeModel } from '@logicflow/core';

export const STEP_NODE_TYPE = 'step-node';

class StepNodeModel extends RectNodeModel {}

class StepNodeView extends RectNode {}

export default {
  type: STEP_NODE_TYPE,
  view: StepNodeView,
  model: StepNodeModel,
};
