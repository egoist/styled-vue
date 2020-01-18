const { parseComponent } = require('vue-template-compiler')
const posthtml = require('posthtml')
const parseScript = require('./parseScript')

module.exports = (content, opts) => {
  const sfc = parseComponent(content, opts)

  if (sfc.script) {
    const {
      style,
      styleLang,
      hasVars,
      scriptContent,
      globalStyle,
      globalStyleLang
    } = parseScript(sfc.script)

    sfc.script.content = scriptContent

    if (sfc.template && hasVars) {
      sfc.template.content = posthtml([
        tree => {
          for (const node of tree) {
            if (node.tag) {
              node.attrs = node.attrs || {}
              const existing =
                node.attrs[':style'] || node.attrs['v-bind:style']
              node.attrs[
                ':style'
              ] = `$options._getCssVariables(this, $options, ${existing})`
            }
          }
          return tree
        }
      ]).process(sfc.template.content, {
        sync: true,
        recognizeSelfClosing: true
      }).html
    }

    let contentLength = content.length

    const addStyleTag = (styleContent, styleLang, isGlobal) => {
      const style = {
        type: 'style',
        content: styleContent,
        attrs: {},
        // TODO: this might be wrong
        start: contentLength,
        end: contentLength + styleContent.length
      }
      if (styleLang) {
        style.lang = styleLang
        style.attrs.lang = styleLang
      }
      if (!isGlobal) {
        style.scoped = true
        style.attrs.scoped = true
      }
      sfc.styles.push(style)
      contentLength += styleContent.length
    }

    if (globalStyle) {
      addStyleTag(globalStyle, globalStyleLang, true)
    }

    if (style) {
      addStyleTag(style, styleLang, false)
    }
  }

  return sfc
}
