const parseComponent = require('../lib/parseComponent')

test('simple', () => {
  const sfc = parseComponent(`
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
  `)

  expect(sfc).toMatchSnapshot()
})

test('no css', () => {
  const sfc = parseComponent(`
  <template>
    <h1 style="foo" :style="{}">hello</h1>
  </template>
  <script>
  export default {}
  </script>
  `)

  expect(sfc).toMatchSnapshot()
})

test('no vars', () => {
  const sfc = parseComponent(`
  <template>
    <h1 style="foo" :style="{}">hello</h1>
  </template>
  <script>
  import { css } from 'styled-vue'
  export default {
    style: css\`h1 {color: red}\`
  }
  </script>
  `)

  expect(sfc).toMatchSnapshot()
})
