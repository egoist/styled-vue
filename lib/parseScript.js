const parser = require('@babel/parser')
const traverse = require('@babel/traverse')
const generator = require('@babel/generator')
const t = require('@babel/types')
const hashSum = require('hash-sum')
const { UNITS_RE } = require('./units')

const LANGS = ['css', 'stylus', 'less', 'sass', 'scss']

module.exports = script => {
  let style
  let styleLang
  let globalStyle
  let globalStyleLang
  let hasVars = false
  let hasGlobalVars = false

  const ast = parser.parse(script.content, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'objectRestSpread',
      'classProperties',
      'decorators-legacy',
      'dynamicImport'
    ]
  })

  const parseTaggedTemplate = ref => {
    const { quasi } = ref.node
    const quasis = []
    const vars = []
    const varDeclarations = []

    for (const [i, q] of quasi.quasis.entries()) {
      quasis.push(q)
      if (quasi.expressions[i]) {
        const variableId = `v${hashSum(quasi.expressions[i])}`
        const value = `var(--${variableId})`
        quasis.push({
          type: 'TemplateElement',
          value: { raw: value, cooked: value }
        })

        // Check unit
        let unit
        const nextQuasis = quasi.quasis[i + 1]
        if (nextQuasis) {
          // Test the next 6 chars
          const match = UNITS_RE.exec(nextQuasis.value.raw.slice(0, 6))
          unit = match && match[1]
          if (unit) {
            nextQuasis.value.raw = nextQuasis.value.raw.slice(unit.length)
            nextQuasis.value.cooked = nextQuasis.value.cooked.slice(unit.length)
          }
        }

        // var v0 = vm => vm.color
        varDeclarations.push(
          t.variableDeclaration('var', [
            t.variableDeclarator(t.identifier(variableId), quasi.expressions[i])
          ])
        )

        // { '--v0': v0(vm) }
        // { '--v0': v0(vm) + unit }
        const id = t.identifier(variableId)
        const expType = quasi.expressions[i].type
        const mustBeFunction = [
          'FunctionExpression',
          'ArrowFunctionExpression'
        ].includes(expType)
        // TODO: add more conditions
        const mustNotBeFunction =
          expType.endsWith('Literal') || ['BinaryExpression'].includes(expType)
        const getValue = isFunction => {
          let leftExp
          if (isFunction) {
            leftExp = t.callExpression(id, [t.identifier('vm')])
          } else {
            leftExp = id
          }
          return unit
            ? t.binaryExpression('+', leftExp, t.stringLiteral(unit))
            : leftExp
        }
        vars.push(
          t.objectProperty(
            t.stringLiteral(`--${variableId}`),
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

    return {
      extractedStyle: ref.get('quasi').evaluate().value,
      vars,
      varDeclarations
    }
  }

  traverse.default(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value !== 'styled-vue') {
        return
      }

      for (const specifier of path.node.specifiers) {
        if (specifier.type !== 'ImportSpecifier') {
          continue
        }

        const lang = specifier.imported.name

        if (!LANGS.includes(lang)) {
          throw new Error(`[styled-vue] "${lang}" is not supported`)
        }

        const binding = path.scope.getBinding(specifier.local.name)

        for (let i = 0; i < binding.referencePaths.length; i++) {
          // The tagged template path
          const ref = binding.referencePaths[i].parentPath
          // The object property path
          const propertyPath = ref.parentPath

          if (
            !propertyPath ||
            propertyPath.node.type !== 'ObjectProperty' ||
            !['style', 'globalStyle'].includes(propertyPath.node.key.name)
          ) {
            throw new Error(
              `css tag must be assigned to component property "style" or "globalStyle"`
            )
          }

          const isGlobal = propertyPath.node.key.name === 'globalStyle'
          const { vars, varDeclarations, extractedStyle } = parseTaggedTemplate(
            ref
          )
          if (isGlobal) {
            globalStyle = extractedStyle
            globalStyleLang = lang
            if (vars.length > 0) {
              hasGlobalVars = true
            }
          } else {
            style = extractedStyle
            styleLang = lang
            if (vars.length > 0) {
              hasVars = true
            }
          }

          if (vars.length > 0) {
            ref.replaceWith(
              t.functionExpression(
                null,
                [
                  t.identifier('vm'),
                  !isGlobal && t.identifier('existing') // Global vars are handled differently
                ].filter(Boolean),
                t.blockStatement([
                  ...varDeclarations,
                  t.returnStatement(
                    isGlobal
                      ? t.objectExpression(vars)
                      : t.arrayExpression([
                          t.identifier('existing'),
                          t.objectExpression(vars)
                        ])
                  )
                ])
              )
            )
          } else {
            const NoVarsFound = t.identifier('undefined')
            NoVarsFound.trailingComments = [
              { type: 'CommentLine', value: ' No CSS variables' }
            ]
            ref.replaceWith(NoVarsFound)
          }
        }
      }

      // Remove the import
      path.remove()
    }
  })

  return {
    style,
    styleLang,
    globalStyle,
    globalStyleLang,
    hasGlobalVars,
    hasVars,
    scriptContent: generator.default(ast).code
  }
}
