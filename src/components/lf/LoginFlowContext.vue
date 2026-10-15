<template>
  <div>
    <slot />
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LoginFlowContext',
  props: ['lf'],
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
