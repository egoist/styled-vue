<template>
  <div>
    <h1>Hello Nuxt</h1>
    <h2>And hello styled-vue</h2>
    <p>This is awesome!</p>
  </div>
</template>

<script>
import { css } from 'styled-vue'

export default {
  style: css`
    h1 {
      color: red;
    }
    h2 {
      font-style: italic;
    }
    p {
      color: #999;
      background: ${vm => vm.textBg};
    }
  `,
  globalStyle: css`
    body {
      background: ${vm => vm.bg};
    }
  `,
  data() {
    return {
      bg: 'cyan',
      textBg: 'red'
    }
  }
}
</script>

<style></style>
