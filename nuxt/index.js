const path = require('path')

module.exports = function({ registerStyledVue = true } = {}) {
  // Lazy load compiler on build only
  this.nuxt.hook('build:before', () => {
    const { vue } = this.options.build.loaders
    vue.compiler = require('../lib/compiler')
  })

  if (registerStyledVue) {
    this.addPlugin(path.join(__dirname, 'plugin.js'))
  }
}
