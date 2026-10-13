module.exports = {
  mode: 'jit',
  prefix: 'tw-',
  purge: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: false,
  theme: {
    extend: {
      gridTemplateColumns: {
        'flow-editor': 'minmax(0, 1fr) 250px',
      },
      minHeight: {
        'flow-panel': 'calc(100vh - 128px)',
      },
      boxShadow: {
        button: '0 7px 16px #4465e833',
        panel: '0 18px 50px #24335312',
        dialog: '0 20px 60px #17213a44',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
