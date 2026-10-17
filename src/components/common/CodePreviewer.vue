<template>
  <div class="code-previewer">
    <div class="code-previewer__header">
      <div class="code-previewer__meta">
        <span
          v-if="title"
          class="code-previewer__title"
        >
          {{ title }}
        </span>
        <span class="code-previewer__lang">{{ displayLanguage }}</span>
      </div>
      <el-button
        class="code-previewer__copy"
        size="mini"
        plain
        :icon="copied ? 'el-icon-check' : 'el-icon-document-copy'"
        @click="copyCode"
      >
        {{ copied ? '已复制' : '复制' }}
      </el-button>
    </div>
    <el-scrollbar
      class="code-previewer__scroll"
      :style="scrollStyle"
    >
      <div class="code-previewer__body">
        <pre
          v-if="showLineNumbers"
          class="code-previewer__gutter"
          aria-hidden="true"
        ><span
          v-for="n in lineCount"
          :key="n"
          class="code-previewer__line-number"
        >{{ n }}</span></pre>
        <pre class="code-previewer__code hljs"><code v-html="highlightedCode"></code></pre>
      </div>
    </el-scrollbar>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
// 仅注册常用语言的 common 入口，避免全量包体积与动态 require 的 exports 限制
import hljs from 'highlight.js/lib/common';
// 主题样式作用于全局 .hljs 类，需在 JS 中引入（scoped 样式无法覆盖）
import 'highlight.js/styles/atom-one-dark.css';

/**
 * 常规代码展示组件（只读）。
 * - 基于 highlight.js 做语法高亮：传 language 时按指定语言高亮（未注册则降级自动检测），不传则自动检测；
 * - 内置行号 gutter（横向滚动时吸附左侧）、标题栏、语言标签与一键复制；
 * - 滚动区由 el-scrollbar 包裹（悬停显示细滚动条），代码不换行、可双向滚动，行号与代码逐行对齐。
 */
export default defineComponent({
  name: 'CodePreviewer',
  props: {
    /** 待展示的代码文本 */
    code: {
      type: String,
      default: '',
    },
    /** 语言标识（highlight.js 名称或别名，如 javascript / js / bash / json）；为空时自动检测 */
    language: {
      type: String,
      default: '',
    },
    /** 是否显示行号 */
    showLineNumbers: {
      type: Boolean,
      default: true,
    },
    /** 标题栏标题（如文件名），为空时仅展示语言标签 */
    title: {
      type: String,
      default: '',
    },
    /** 代码区最大高度（数字按 px 处理）；为空则不限制高度 */
    maxHeight: {
      type: [String, Number],
      default: 480,
    },
  },
  data() {
    return {
      copied: false,
      copyTimer: null,
    };
  },
  computed: {
    normalizedCode() {
      return this.code == null ? '' : String(this.code);
    },
    /** 高亮结果：html + 实际使用的语言（自动检测时取 hljs 判定值） */
    highlightResult() {
      const code = this.normalizedCode;
      const lang = this.language && hljs.getLanguage(this.language) ? this.language : '';
      if (!code) {
        return { value: '', language: lang || 'text' };
      }
      return lang ? hljs.highlight(code, { language: lang }) : hljs.highlightAuto(code);
    },
    highlightedCode() {
      return this.highlightResult.value;
    },
    displayLanguage() {
      const lang = this.highlightResult.language || 'text';
      return lang.charAt(0).toUpperCase() + lang.slice(1);
    },
    lineCount() {
      const code = this.normalizedCode;
      if (!code) return 1;
      return code.split('\n').length;
    },
    /**
     * 限高通过 CSS 变量下发给 el-scrollbar 的 wrap（真正的滚动容器），
     * 直接限在根节点上无法让 wrap 产生滚动。
     */
    scrollStyle() {
      if (this.maxHeight === '' || this.maxHeight === null || this.maxHeight === undefined) {
        return {};
      }
      const maxHeight = typeof this.maxHeight === 'number' ? `${this.maxHeight}px` : this.maxHeight;
      return { '--code-previewer-max-height': maxHeight };
    },
  },
  beforeDestroy() {
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
      this.copyTimer = null;
    }
  },
  methods: {
    async copyCode() {
      const text = this.normalizedCode;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          this.fallbackCopy(text);
        }
        this.copied = true;
        if (this.copyTimer) clearTimeout(this.copyTimer);
        this.copyTimer = setTimeout(() => {
          this.copied = false;
        }, 1500);
        if (this.$message) {
          this.$message.success('代码已复制');
        }
      } catch (error) {
        if (this.$message) {
          this.$message.error('复制失败，请手动选择代码复制');
        }
      }
    },
    /** 非安全上下文（如 http / 旧浏览器）下的兜底复制方案 */
    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (!ok) {
        throw new Error('execCommand copy failed');
      }
    },
  },
});
</script>

<style>
/* 主题 CSS 已在脚本中引入；这里仅定义组件外壳样式（需穿透到全局 .hljs，故不使用 scoped） */
.code-previewer {
  overflow: hidden;
  background: #282c34;
  border: 1px solid #20242d;
  border-radius: 10px;
}

.code-previewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: #21252b;
  border-bottom: 1px solid #181a1f;
}

.code-previewer__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.code-previewer__title {
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  color: #abb2bf;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-previewer__lang {
  flex-shrink: 0;
  padding: 1px 8px;
  background: rgba(97, 175, 239, 0.16);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #61afef;
}

.code-previewer__copy {
  flex-shrink: 0;
  color: #abb2bf;
  border-color: #3a3f4b;
  background: transparent;
}

.code-previewer__copy:hover,
.code-previewer__copy:focus {
  color: #ffffff;
  border-color: #61afef;
  background: rgba(97, 175, 239, 0.12);
}

/* el-scrollbar 的根节点默认无高度约束，限高交给内部 wrap */
.code-previewer__scroll {
  background: #282c34;
}

/* wrap 是唯一滚动容器：覆盖默认 height:100%，改用 max-height 限高，内容短时随内容自适应 */
.code-previewer__scroll .el-scrollbar__wrap {
  height: auto;
  max-height: var(--code-previewer-max-height, none);
}

/*
 * 内容层需按内容撑开（max-content）：
 * 行号 gutter 相对 wrap 做 sticky，若 body 只占可视区一屏宽，
 * 横向滚动超过一屏后 gutter 会提前脱离吸附；min-width:100% 保证短代码时仍铺满。
 */
.code-previewer__body {
  display: flex;
  width: max-content;
  min-width: 100%;
  background: #282c34;
}

.code-previewer__gutter,
.code-previewer__code {
  margin: 0;
  padding-top: 12px;
  padding-bottom: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.code-previewer__gutter {
  position: sticky;
  left: 0;
  z-index: 1;
  flex-shrink: 0;
  padding-right: 12px;
  padding-left: 14px;
  color: #636d83;
  text-align: right;
  user-select: none;
  background: #282c34;
  border-right: 1px solid #3a3f4b;
}

.code-previewer__line-number {
  display: block;
}

.code-previewer__code {
  flex: 1 0 auto;
  padding-right: 16px;
  padding-left: 16px;
  background: transparent;
  border-radius: 0;
}

.code-previewer__code code {
  padding: 0;
  background: transparent;
  font-family: inherit;
  white-space: pre;
}
</style>
