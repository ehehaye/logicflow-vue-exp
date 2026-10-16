<template>
  <main class="app-shell">
    <div class="app-panel">
      <header class="app-header">
        <div class="tw-flex tw-items-center tw-gap-3">
          <span class="app-logo">LF</span>
          <div class="tw-flex tw-flex-col">
            <h1 class="app-title">LogicFlow 流水线编排</h1>
            <p class="app-subtitle">基于 Vue 2.7 的流程编辑器示例</p>
          </div>
        </div>

        <div class="view-switch">
          <span
            class="view-switch__indicator"
            :style="indicatorStyle"
          />
          <button
            v-for="view in views"
            :key="view.name"
            type="button"
            class="view-switch__item"
            :class="{ 'view-switch__item--active': activeView === view.name }"
            @click="activeView = view.name"
          >
            {{ view.label }}
          </button>
        </div>
      </header>

      <Component :is="activeView" />
    </div>
  </main>
</template>

<script>
import { defineComponent } from 'vue';
import Classic from '@/views/classic.vue';
import Reactive from '@/views/reactive.vue';

/** 可切换的画布视图配置 */
const VIEW_OPTIONS = [
  { name: 'Reactive', label: '数据驱动' },
  { name: 'Classic', label: '事件驱动' },
];

/** 分段控件单项宽度（px），需与样式中的按钮宽度保持一致 */
const SWITCH_ITEM_WIDTH = 96;

export default defineComponent({
  name: 'App',
  components: {
    Classic,
    Reactive,
  },
  data() {
    return {
      views: VIEW_OPTIONS,
      activeView: VIEW_OPTIONS[0].name,
    };
  },
  computed: {
    /** 分段控件滑块位置 */
    indicatorStyle() {
      const index = this.views.findIndex((view) => view.name === this.activeView);
      return {
        width: `${SWITCH_ITEM_WIDTH}px`,
        transform: `translateX(${Math.max(index, 0) * SWITCH_ITEM_WIDTH}px)`,
      };
    },
  },
});
</script>
