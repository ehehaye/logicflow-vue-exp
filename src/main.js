import ElementUI from 'element-ui';
import Vue from 'vue';
import App from './App.vue';
import 'element-ui/lib/theme-chalk/index.css';
// 全局样式放在 Element UI 主题之后引入，保证覆盖优先级
import './styles.css';

Vue.use(ElementUI);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
