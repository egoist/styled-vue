const path = require('path')

module.exports = {
  entry: path.join(__dirname, 'index.js'),
  chainWebpack(config) {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.compiler = require('../compiler')
        return options
      })

    config.resolve.alias.set('styled-vue', path.join(__dirname, '../lib'))
  }
}
