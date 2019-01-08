const { parseComponent } = require('vue-template-compiler')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse')
const generator = require('@babel/generator')
const t = require('@babel/types')
const posthtml = require('posthtml')

const LANGS = ['css', 'stylus', 'less', 'sass', 'scss']

const CSS_UNITS = [
  ...['cm', 'mm', 'in', 'px', 'pt', 'pc'],
  ...['em', 'eh', 'ex', 'rem', 'vw', 'vh', 'vmin', 'vmax', '%']
]

const UNIT_RE = new RegExp(`(${CSS_UNITS.join('|')});?(\\s|\\n|$)`)

module.exports = (content, opts) => {
  const sfc = parseComponent(content, opts)

  if (sfc.script) {
    // Transform script
    const ast = parser.parse(sfc.script.content, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'objectRestSpread',
        'classProperties',
        'decorators-legacy'
      ]
    })

    let style
    let styleLang
    let hasVars = false

    traverse.default(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value !== 'styled-vue') {
          return
        }

        for (const specifier of path.node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') {
            continue
          }

          styleLang = specifier.imported.name

          if (!LANGS.includes(styleLang)) {
            throw new Error(`[styled-vue] "${styleLang}" is not supported`)
          }

          const binding = path.scope.getBinding(specifier.local.name)
          for (let i = 0; i < binding.referencePaths.length; i++) {
            const vars = []
            const ref = binding.referencePaths[i].parentPath
            const { quasi } = ref.node
            const quasis = []
            const varDeclarations = []
            for (const [i, q] of quasi.quasis.entries()) {
              quasis.push(q)
              if (quasi.expressions[i]) {
                const value = `var(--v${i})`
                quasis.push({
                  type: 'TemplateElement',
                  value: { raw: value, cooked: value }
                })
                hasVars = true

                // Check unit
                let unit
                const nextQuasis = quasi.quasis[i + 1]
                if (nextQuasis) {
                  // Test the next 5 chars
                  const match = UNIT_RE.exec(nextQuasis.value.raw.slice(0, 5))
                  unit = match && match[1]
                  if (unit) {
                    nextQuasis.value.raw = nextQuasis.value.raw.slice(
                      unit.length
                    )
                    nextQuasis.value.cooked = nextQuasis.value.cooked.slice(
                      unit.length
                    )
                  }
                }

                // var v0 = vm => vm.color
                varDeclarations.push(
                  t.variableDeclaration('var', [
                    t.variableDeclarator(
                      t.identifier(`v${i}`),
                      quasi.expressions[i]
                    )
                  ])
                )

                // { '--v0': v0(vm, existing) }
                // { '--v0': v0(vm, existing) + unit }
                const id = t.identifier(`v${i}`)
                const expType = quasi.expressions[i].type
                const mustBeFunction = [
                  'FunctionExpression',
                  'ArrowFunctionExpression'
                ].includes(expType)
                // TODO: add more conditions
                const mustNotBeFunction =
                  expType.endsWith('Literal') ||
                  ['BinaryExpression'].includes(expType)
                const getValue = isFunction => {
                  let leftExp
                  if (isFunction) {
                    leftExp = t.callExpression(id, [
                      t.identifier('vm'),
                      t.identifier('existing')
                    ])
                  } else {
                    leftExp = id
                  }
                  return unit
                    ? t.binaryExpression('+', leftExp, t.stringLiteral(unit))
                    : leftExp
                }
                vars.push(
                  t.objectProperty(
                    t.stringLiteral(`--v${i}`),
                    mustBeFunction
                      ? getValue(true)
                      : mustNotBeFunction
                      ? getValue(false)
                      : t.conditionalExpression(
                          t.binaryExpression(
                            '===',
                            t.unaryExpression('typeof', id),
                            t.stringLiteral('function')
                          ),
                          getValue(true),
                          getValue(false)
                        )
                  )
                )
              }
            }

            const str = quasis.reduce((res, next) => {
              res += next.value.raw
              return res
            }, '')

            ref.node.quasi.quasis = [
              {
                type: 'TemplateElement',
                value: { raw: str, cooked: str },
                tail: true
              }
            ]
            ref.node.quasi.expressions = []
            style = ref.get('quasi').evaluate().value

            if (hasVars) {
              ref.replaceWith(
                t.functionExpression(
                  null,
                  [t.identifier('vm'), t.identifier('existing')],
                  t.blockStatement([
                    ...varDeclarations,
                    t.returnStatement(
                      t.callExpression(
                        t.memberExpression(
                          t.identifier('Object'),
                          t.identifier('assign')
                        ),
                        [t.objectExpression(vars), t.identifier('existing')]
                      )
                    )
                  ])
                )
              )
            } else {
              ref.replaceWith(t.identifier('undefined'))
            }
          }
        }

        // Remove the import
        path.remove()
      }
    })

    if (sfc.template && hasVars) {
      sfc.template.content = posthtml([
        tree => {
          for (const node of tree) {
            if (node.tag) {
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

    // TODO: update the start / end for script and custom blocks as well
    sfc.script.content = generator.default(ast).code
  }

  return sfc
}
