const parseComponent = require('../lib/parseComponent')

function snapshot(title, source) {
  test(title, () => {
    const sfc = parseComponent(source)
    const output = `
  <template>
  ${sfc.template.content}
  </template>

  <script>
  ${sfc.script.content}
  </script>

  ${sfc.styles
    .map(
      style => `
  <style scoped="${style.scoped}" lang="${style.lang}">
  ${style.content}
  </style>
  `
    )
    .join('\n')}
  `
    expect(`
  === source ===
  ${source}

  === output ===
  ${output}
  `).toMatchSnapshot()
  })
}

snapshot(
  'simple',
  `
  <template>
    <h1 style="foo" :style="{}">hello</h1>
  </template>
  <script>
  import { css } from 'styled-vue'
  export default {
    style: css\`
    h1 {
      color: \${vm => vm.color};
      width: \${200 + 1}px;
    }
    \`
  }
  </script>
  `
)

snapshot(
  'no css',
  `
<template>
  <h1 style="foo" :style="{}">hello</h1>
</template>
<script>
export default {}
</script>
`
)

snapshot(
  'no vars',
  `
<template>
  <h1 style="foo" :style="{}">hello</h1>
</template>
<script>
import { css } from 'styled-vue'
export default {
  style: css\`h1 {color: red}\`
}
</script>
`
)

snapshot(
  'global style',
  `
<template>
<h1>hello</h1>
</template>
<script>
import { css } from 'styled-vue'
export default {
  globalStyle: css\`h1 {color: red}\`
}
</script>
`
)

snapshot(
  'global style with scoped style',
  `
<template>
<h1>hello</h1>
</template>
<script>
import { css } from 'styled-vue'
export default {
  style: css\`h1 {color: cyan}\`,
  globalStyle: css\`h1 {color: red}\`
}
</script>
`
)

snapshot(
  'global style with scoped style with css variables',
  `
<template>
<h1>hello</h1>
</template>
<script>
import { css } from 'styled-vue'
export default {
  style: css\`h1 {color: cyan}\`,
  globalStyle: css\`h1 {color: red; font-size: \${vm => vm.fontSize};}\`
}
</script>
`
)
