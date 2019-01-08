exports.name = 'styled-vue'

exports.apply = api => {
  api.hook('createWebpackChain', config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        return Object.assign({}, options, { compiler: require('../compiler') })
      })
  })
}
