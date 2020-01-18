/* eslint-disable */
Object.defineProperty(exports, '__esModule', { value: true })

function css(_) {
  throw new Error(
    `You need to replace vue-template-compiler with styled-vue/compiler`
  )
}

function StyledVue(Vue) {
  Vue.component('styled-vue-global-css', {
    render(h) {
      const globalStyle = this.$parent.$options.globalStyle(this.$parent)
      let css = ''
      for (const key in globalStyle) {
        css += key + ':' + globalStyle[key] + ';'
      }
      return h('style', {}, [':root {' + css + '}'])
    }
  })
}

exports.css = css

exports.StyledVue = StyledVue
