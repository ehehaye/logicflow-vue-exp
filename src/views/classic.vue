<template>
  <LogicFlow>
    <PipelineClassic />
  </LogicFlow>
</template>

<script>
import { defineComponent } from 'vue';
import LogicFlow from '@/components/lf/LogicFlow.vue';
import PipelineClassic from '@/components/lf/scenes/PipelineClassic.vue';

export default defineComponent({
  name: 'ClassicView',
  components: {
    LogicFlow,
    PipelineClassic,
  },
});
</script>
