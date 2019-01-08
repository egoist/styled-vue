# styled-vue

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
  - [Use with webpack](#use-with-webpack)
  - [Use with Vue CLI](#use-with-vue-cli)
  - [Use with Poi](#use-with-poi)
  - [CSS Preprocessors](#css-preprocessors)
  - [Global Styles](#global-styles)
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

## Example

```vue
<template>
  <div><h1 class="title">hello there!</h1></div>
</template>

<script>
import { css } from 'styled-vue'

export default {
  style: css`
    .title {
      /* You can access component's "this" via "vm" */
      color: ${vm => vm.$store.state.themeColor};
    }
  `
}
</script>
```

And that's it, it's like writing `.vue` file's scoped CSS in the `<script>` tag.

## How to use

### Use with webpack

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

### Use with Vue CLI

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

### Use with Poi

Guess what, it's the same as Vue CLI :)

### CSS Preprocessors

```js
import { css, less, sass, scss, stylus } from 'styled-vue'
```

Just use corresponding exports from `styled-vue`.

The CSS will be passed to `vue-loader`, so it really just works like `<style scoped>`.

### Global Styles

I think you should not do this, but I'm open for other thoughts, let's discuss it in issue tracker if you want this feature.

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
