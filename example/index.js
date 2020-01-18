import Vue from 'vue'
import { StyledVue } from 'styled-vue'
import App from './App.vue'

Vue.use(StyledVue)

new Vue({
  el: '#app',
  render: h => h(App)
})
