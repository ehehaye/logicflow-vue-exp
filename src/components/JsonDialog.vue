<template>
  <el-dialog
    :visible.sync="dialogVisible"
    title="当前画布 JSON"
    width="760px"
    append-to-body
    custom-class="flow-json-dialog"
  >
    <pre
      class="tw-m-0 tw-p-4 tw-overflow-auto tw-text-xs tw-leading-[1.6] tw-font-mono tw-text-[#c7d2eb] tw-bg-[#151d31] tw-rounded-[9px]"
      >{{ json }}</pre>
  </el-dialog>
</template>

<script>
import { defineComponent } from 'vue';

/**
 * JsonDialog —— 展示导出结果的 JSON 弹窗。
 *
 * 由 `visible` 控制显隐；点击遮罩或关闭按钮时通过 `close` 事件通知父级。
 */
export default defineComponent({
  name: 'JsonDialog',
  props: {
    /** 是否显示弹窗 */
    visible: {
      type: Boolean,
      default: false,
    },
    /** 待展示的 JSON 字符串 */
    json: {
      type: String,
      default: '',
    },
  },
  emits: ['close'],
  computed: {
    /** el-dialog 的双向绑定：关闭时向父级 emit `close` */
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        if (!value) this.$emit('close');
      },
    },
  },
});
</script>
