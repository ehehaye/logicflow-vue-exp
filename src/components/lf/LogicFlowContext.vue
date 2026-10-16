<template>
  <div>
    <slot />
  </div>
</template>

<script>
import { defineComponent } from 'vue';

/**
 * LogicFlow 上下文透传层。
 * 向插槽内的场景组件 provide 画布实例与图模型：
 * - 直接值供立即使用（如模板依赖 graphModel 的响应式状态）；
 * - inject 函数供在生命周期 / 方法中惰性取最新实例，避免闭包捕获旧值。
 */
export default defineComponent({
  name: 'LogicFlowContext',
  props: {
    /** LogicFlow 类实例（非纯对象，用 validator 代替内置 Object 类型检查） */
    lf: {
      required: true,
      validator: (value) => Boolean(value?.graphModel),
    },
  },
  provide() {
    return {
      lf: this.lf,
      injectLf: () => this.lf,
      graphModel: this.lf.graphModel,
      injectGraphModel: () => this.lf.graphModel,
    };
  },
});
</script>
