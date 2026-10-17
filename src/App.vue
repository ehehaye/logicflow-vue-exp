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

        <div class="tw-flex tw-items-center tw-gap-3">
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

          <a
            class="app-github-link"
            :href="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            title="在 GitHub 上查看源码"
            aria-label="在 GitHub 上查看源码"
          >
            <svg
              viewBox="0 0 16 16"
              width="20"
              height="20"
              aria-hidden="true"
              fill="currentColor"
            >
              <path
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
              />
            </svg>
          </a>
        </div>
      </header>

      <div class="app-content">
        <Component :is="activeView" />
      </div>
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
      githubUrl: 'https://github.com/ehehaye/logicflow-vue-exp',
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
