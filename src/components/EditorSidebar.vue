<template>
  <aside class="tw-flex tw-flex-col tw-gap-3 tw-py-6 tw-px-[18px] tw-bg-[#f8faff] tw-border-l tw-border-[#e3e8f1]">
    <div>
      <p class="tw-text-[11px] tw-font-extrabold tw-tracking-[.12em] tw-text-[#7d8aa6]">流程控制</p>
      <h2 class="tw-mb-[7px] tw-text-lg tw-tracking-[-.025em]">纵向串联节点</h2>
      <p class="tw-mb-[10px] tw-text-[13px] tw-leading-[1.55] tw-text-[#71809c]">
        每次新增节点都会自动接在当前最后一个节点的下方。
      </p>
    </div>

    <div class="tw-p-[14px] tw-bg-white tw-border tw-border-[#e0e6f0] tw-rounded-[10px]">
      <p class="tw-text-[11px] tw-font-extrabold tw-tracking-[.12em] tw-text-[#7d8aa6]">当前选择</p>
      <el-input
        v-model="labelDraft"
        class="tw-mt-[7px]"
        placeholder="未选择节点"
        :disabled="!hasSelectedNode || readonly"
        @input="onLabelInput"
      />
      <small
        v-if="hasSelectedNode"
        class="tw-block tw-mt-[5px] tw-text-xs tw-leading-[1.5] tw-text-[#8190a9]"
      >
        可编辑名称；可拖动节点；删除时会自动桥接上下游。
      </small>
      <small
        v-else
        class="tw-block tw-mt-[5px] tw-text-xs tw-leading-[1.5] tw-text-[#8190a9]"
      >
        请先在画布中选择一个节点。
      </small>
    </div>

    <div class="tw-mt-auto tw-pt-5 tw-text-xs tw-leading-[1.6] tw-text-[#72809a] tw-border-t tw-border-[#e5eaf2]">
      <p class="tw-text-[11px] tw-font-extrabold tw-tracking-[.12em] tw-text-[#7d8aa6]">操作提示</p>
      <ol class="tw-list-decimal tw-mt-2 tw-pl-[18px]">
        <li>点击节点后可拖动调整位置。</li>
        <li>边不可选中、不可调整或编辑。</li>
        <li>删除中间节点会自动连接其前后节点。</li>
        <li>清空操作需要先选中任意节点。</li>
      </ol>
    </div>
  </aside>
</template>

<script>
import { defineComponent } from 'vue';

/**
 * EditorSidebar —— 右侧属性面板。
 *
 * 仅负责展示选中节点名称并提供编辑输入框，图数据与选中态均由父级
 * （FlowCanvas 经 `sidebar` 作用域插槽）持有，本组件只展示与触发。
 */
export default defineComponent({
  name: 'EditorSidebar',
  props: {
    /** 当前选中节点的展示标签 */
    selectedNodeLabel: {
      type: String,
      default: '未选择节点',
    },
    /** 是否存在选中节点 */
    hasSelectedNode: {
      type: Boolean,
      default: false,
    },
    /** 是否为只读模式 */
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update-label'],
  data() {
    return {
      /** 输入框草稿值，随选中节点变化而同步 */
      labelDraft: this.selectedNodeLabel,
    };
  },
  watch: {
    /** 选中节点变化时，刷新输入框内容 */
    selectedNodeLabel(value) {
      this.labelDraft = value;
    },
  },
  methods: {
    /** 输入时把新标签冒泡给父级（未选中或只读时忽略） */
    onLabelInput() {
      if (!this.hasSelectedNode || this.readonly) return;
      this.$emit('update-label', this.labelDraft);
    },
  },
});
</script>
