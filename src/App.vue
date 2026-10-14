<template>
  <Pipeline />
</template>

<script>
import { defineComponent } from 'vue';
import Pipeline from '@/views/design/pipeline.vue';

export default defineComponent({
  name: 'App',
  components: {
    Pipeline,
  },
});
</script>
