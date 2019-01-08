const { parseComponent } = require('vue-template-compiler')
const posthtml = require('posthtml')
const parseScript = require('./parseScript')

module.exports = (content, opts) => {
  const sfc = parseComponent(content, opts)

  if (sfc.script) {
    const { style, styleLang, hasVars, scriptContent } = parseScript(sfc.script)

    sfc.script.content = scriptContent

    if (sfc.template && hasVars) {
      sfc.template.content = posthtml([
        tree => {
          for (const node of tree) {
            if (node.tag) {
              node.attrs = node.attrs || {}
              const existing =
                node.attrs[':style'] || node.attrs['v-bind:style']
              node.attrs[':style'] = `$options.style(this, ${existing})`
            }
          }
          return tree
        }
      ]).process(sfc.template.content, {
        sync: true,
        recognizeSelfClosing: true
      }).html
    }

    if (style) {
      sfc.styles.push({
        type: 'style',
        content: style,
        attrs: { scoped: true, lang: styleLang },
        scoped: true,
        lang: styleLang,
        // TODO: this might be wrong
        start: content.length,
        end: content.length + style.length
      })
    }
  }

  return sfc
}
