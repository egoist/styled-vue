![styled-vue](https://user-images.githubusercontent.com/8784712/50833110-30b41180-138b-11e9-9ddd-20af6afc1747.png)

---

[![NPM version](https://badgen.net/npm/v/styled-vue)](https://npmjs.com/package/styled-vue) [![NPM downloads](https://badgen.net/npm/dm/styled-vue)](https://npmjs.com/package/styled-vue) [![CircleCI](https://badgen.net/circleci/github/egoist/styled-vue/master)](https://circleci.com/gh/egoist/styled-vue/tree/master) [![donate](https://badgen.net/badge/support%20me/donate/ff69b4)](https://patreon.com/egoist) [![chat](https://badgen.net/badge/chat%20on/discord/7289DA)](https://chat.egoist.moe)

**Please consider [donating](https://www.patreon.com/egoist) to this project's author, [EGOIST](#author), to show your ❤️ and support.**

## Features

- Zero-runtime CSS-in-JS for Vue SFC without compromise
- Scoped CSS by default
- CSS preprocessors support
- Dynamic style just works (no IE support)
- Working with SSR out-of-the-box
- Hot module replacement still works
- You get all the features without any config!

## Table of Contents

<!-- toc -->

- [Install](#install)
- [Example](#example)
- [How to use](#how-to-use)
  - [Using with webpack](#using-with-webpack)
  - [Using with Vue CLI](#using-with-vue-cli)
  - [Using with Poi](#using-with-poi)
  - [Using with Nuxt.js](#using-with-nuxtjs)
  - [How does it work](#how-does-it-work)
  - [CSS Preprocessors](#css-preprocessors)
  - [Global Styles](#global-styles)
  - [TypeScript](#typescript)
- [Editor Plugins](#editor-plugins)
  - [VSCode](#vscode)
  - [Atom](#atom)
- [Inspirations](#inspirations)
- [Contributing](#contributing)
- [Author](#author)

<!-- tocstop -->

## Install

```bash
yarn add styled-vue --dev
```

Then register the Vue plugin (**optional**):

```js
import Vue from 'vue'
import { StyledVue } from 'styled-vue'

Vue.use(StyledVue)
```

So far the plugin is only required for [globalStyle](#global-styles), if you only need scoped style, you can safely skip this.

## Example

```vue
<template>
  <div><h1 class="title">hello there!</h1></div>
</template>

<script>
import { css } from 'styled-vue'
import { modularScale } from 'polished'

export default {
  style: css`
    .title {
      /* You can access component's "this" via "vm" */
      color: ${vm => vm.$store.state.themeColor};
      font-size: ${modularScale(2)};
      margin: 0;
    }
  `
}
</script>
```

And that's it, it's like writing `.vue` file's scoped CSS in the `<script>` tag.

## How to use

### Using with webpack

I did say that `styled-vue` works without config, that might be a clickbait because you do need a single line of config in your `webpack.config.js`:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          compiler: require('styled-vue/compiler') // <- here
        }
      }
    ]
  }
}
```

### Using with Vue CLI

In your `vue.config.js`:

```js
module.exports = {
  chainWebpack(config) {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.compiler = require('styled-vue/compiler') // <- here
        return options
      })
  }
}
```

### Using with Poi

In your `poi.config.js`:

```js
module.exports = {
  plugins: ['styled-vue/poi']
}
```

### Using with Nuxt.js

In your `nuxt.config.js`:

```js
export default {
  modules: ['styled-vue/nuxt']
}
```

### How does it work

Input:

```vue
<template>
  <h1>hello</h1>
</template>

<script>
import { css } from 'styled-vue'

export default {
  style: css`
    h1 {
      color: ${vm => vm.color};
      width: ${200 + 1}px;
    }
  `
}
</script>
```

Output:

```vue
<template>
  <h1 :style="$options.style(this)">hello</h1>
</template>

<script>
export default {
  style: function(vm) {
    var v0 = vm => vm.color
    var v1 = 200 + 1
    return {
      '--v0': v0(vm),
      '--v1': v1 + 'px'
    }
  }
}
</script>

<style scoped>
h1 {
  color: var(--v0);
  width: var(--v1);
}
</style>
```

Under the hood, it uses [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables) for dynamic styles, that's why this feature is not supported in IE.

### CSS Preprocessors

```js
import { less, sass, scss, stylus } from 'styled-vue'
```

Just use corresponding exports from `styled-vue`.

The CSS will be passed to `vue-loader` and parsed by PostCSS if a `postcss.config.js` exists in your project, so it really just works like `<style scoped>`.

### Global Styles

Use `globalStyle` instead of `style` on your component:

```js
import { css } from 'styled-vue'

export default {
  globalStyle: css`
    body {
      color: ${vm => vm.bodyColor};
    }
  `
}
```

`globalStyle` relies on the Vue plugin, make sure to register it first:

```js
import Vue from 'vue'
import { StyledVue } from 'styled-vue'

Vue.use(StyledVue)
```

This only adds ~100 bytes to your application.

### TypeScript

We use Babel to parse your code, so TypeScript should work out-of-the-box, however there're some [caveats](https://babeljs.io/docs/en/babel-plugin-transform-typescript#caveats).

## Editor Plugins

### VSCode

- Syntax Highlighting - [language-babel](https://marketplace.visualstudio.com/items?itemName=mgmcdermott.vscode-language-babel)
- Autocompletion - [vscode-styled-components](https://marketplace.visualstudio.com/items?itemName=jpoissonnier.vscode-styled-components)
- Linting - [stylelint](https://marketplace.visualstudio.com/items?itemName=shinnn.stylelint)

### Atom

- Syntax Highlighting and Autocompletion - [language-babel](https://atom.io/packages/language-babel)

## Inspirations

- [linaria](https://github.com/callstack/linaria)
- [lit-vue](https://github.com/egoist/lit-vue)

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

**styled-vue** © EGOIST, Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by EGOIST with help from contributors ([list](https://github.com/egoist/styled-vue/contributors)).

> [Website](https://egoist.sh) · GitHub [@EGOIST](https://github.com/egoist) · Twitter [@\_egoistlily](https://twitter.com/_egoistlily)
