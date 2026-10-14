<template>
  <aside class="tw-flex tw-flex-col tw-gap-3 tw-py-6 tw-px-[18px] tw-bg-[#f8faff] tw-border-l tw-border-[#e3e8f1]">
    <div class="tw-p-[14px] tw-bg-white tw-border tw-border-[#e0e6f0] tw-rounded-[10px]">
      <p class="tw-text-[11px] tw-font-extrabold tw-tracking-[.12em] tw-text-[#7d8aa6]">当前选择</p>
      <el-input
        v-if="node"
        :value="node.getData().text.value"
        class="tw-mt-[7px]"
        @input="change"
      />
      <small
        v-else
        class="tw-block tw-mt-[5px] tw-text-xs tw-leading-[1.5] tw-text-[#8190a9]"
      >
        请先在画布中选择一个节点。
      </small>
    </div>
  </aside>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NodeEditor',
  props: {
    node: {
      type: Object,
      default: null,
    },
  },
  emits: ['update'],
  methods: {
    change(e) {
      const id = this.node?.getData()?.id;
      if (id) this.$emit('update', { id, text: e });
    },
  },
});
</script>
