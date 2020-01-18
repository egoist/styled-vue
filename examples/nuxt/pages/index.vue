<template>
  <div>
    <h1>Hello Nuxt</h1>
    <h2>And hello styled-vue</h2>
    <p>This is awesome! (maybe)</p>
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
  `,
  globalStyle: css`
    body {
      background: ${vm => vm.bg};
    }
  `,
  data() {
    return {
      bg: 'cyan'
    }
  }
}
</script>

<style></style>
