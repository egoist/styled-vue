module.exports = function() {
  // Lazy load compiler on build only
  this.nuxt.hook('build:before', () => {
    const { vue } = this.options.build.loaders
    if (!vue.compiler) {
      vue.compiler = require('../lib/compiler')
    }
  })
}
