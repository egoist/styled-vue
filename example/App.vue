<template>
  <div id="app">
    <h1>hello</h1>
    <ul>
      <li>something foo</li>
      <li>something bar</li>
    </ul>
  </div>
</template>

<script>
import { css } from 'styled-vue'

export default {
  style: css`
  #app {
    background-color: ${vm => vm.theme === 'dark' ? '#000' : 'f0f0f0'};
    width: ${300}px;
  }
  h1 {
    color: ${vm => vm.color};
  }
  ul {
    list-style: square;
  }
  `,
  data() {
    return {
      color: 'magenta',
      theme: 'dark'
    }
  }
}
</script>
