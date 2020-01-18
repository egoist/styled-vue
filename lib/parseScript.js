const parser = require('@babel/parser')
const traverse = require('@babel/traverse')
const generator = require('@babel/generator')
const t = require('@babel/types')
const { UNITS_RE } = require('./units')

const LANGS = ['css', 'stylus', 'less', 'sass', 'scss']

module.exports = script => {
  let style
  let styleLang
  let hasVars = false
  let globalStyle
  let globalStyleLang

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

  const parseTaggedTemplate = (ref, isGlobal) => {
    const { quasi } = ref.node
    const quasis = []
    const vars = []
    const varDeclarations = []
    const variablePrefix = isGlobal ? 'gv' : `v`

    for (const [i, q] of quasi.quasis.entries()) {
      quasis.push(q)
      if (quasi.expressions[i]) {
        const value = `var(--${variablePrefix}${i})`
        quasis.push({
          type: 'TemplateElement',
          value: { raw: value, cooked: value }
        })
        hasVars = true

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
            t.variableDeclarator(
              t.identifier(`${variablePrefix}${i}`),
              quasi.expressions[i]
            )
          ])
        )

        // { '--v0': v0(vm) }
        // { '--v0': v0(vm) + unit }
        const id = t.identifier(`${variablePrefix}${i}`)
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
            t.stringLiteral(`--${variablePrefix}${i}`),
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

        styleLang = specifier.imported.name

        if (!LANGS.includes(styleLang)) {
          throw new Error(`[styled-vue] "${styleLang}" is not supported`)
        }

        const binding = path.scope.getBinding(specifier.local.name)
        let objectExpressionPath
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

          // The object expression path
          objectExpressionPath = propertyPath.parentPath

          const isGlobal = propertyPath.node.key.name === 'globalStyle'
          const { vars, varDeclarations, extractedStyle } = parseTaggedTemplate(
            ref,
            isGlobal
          )
          if (isGlobal) {
            globalStyle = extractedStyle
          } else {
            style = extractedStyle
          }

          if (vars.length > 0) {
            ref.replaceWith(
              t.functionExpression(
                null,
                [t.identifier('vm'), t.identifier('existing')],
                t.blockStatement([
                  ...varDeclarations,
                  t.returnStatement(t.objectExpression(vars))
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

        if (hasVars && objectExpressionPath) {
          const createObjectCall = name => {
            return t.logicalExpression(
              '&&',
              t.memberExpression(t.identifier('options'), t.identifier(name)),
              t.callExpression(
                t.memberExpression(t.identifier('options'), t.identifier(name)),
                [t.identifier('vm')]
              )
            )
          }

          objectExpressionPath.node.properties.push(
            t.objectProperty(
              t.identifier('_getCssVariables'),
              t.functionExpression(
                null,
                [
                  t.identifier('vm'),
                  t.identifier('options'),
                  t.identifier('existing')
                ],
                t.blockStatement([
                  t.returnStatement(
                    t.arrayExpression([
                      t.identifier('existing'),
                      createObjectCall('globalStyle'),
                      createObjectCall('style')
                    ])
                  )
                ])
              )
            )
          )
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
    hasVars,
    scriptContent: generator.default(ast).code
  }
}
