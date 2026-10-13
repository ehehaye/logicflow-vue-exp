import antfu from '@antfu/eslint-config'

export default antfu({
  // Vue 2 项目（Vue 2 已 EOL，@antfu/eslint-config 需手动声明版本）
  vue: {
    vueVersion: 2,
  },
})
