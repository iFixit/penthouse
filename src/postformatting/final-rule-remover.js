import csstree from 'css-tree'

export default function finalRuleRemover (ast, propertiesToRemove) {
  // remove empty rules
  csstree.walk(ast, {
    visit: 'Rule',
    leave: (rule, item, list) => {
      if (rule.block.children.isEmpty()) {
        list.remove(item)
      }
    }
  })

  // remove unwanted and empty at-rules
  csstree.walk(ast, {
    visit: 'Atrule',
    leave: function (atrule, item, list) {
      const name = csstree.keyword(atrule.name).basename

      /* ==@-rule handling== */
      /* - Case 0 : Non nested @-rule [REMAIN]
         (@charset, @import, @namespace)
      */
      if (name === 'charset' || name === 'import' || name === 'namespace') {
        return
      }

      /* Case 1: @-rule with CSS properties inside [REMAIN]
         @font-face, @keyframes - keep here, but remove later in code, unless it is used.
         @property - utilities (f.e. Tailwind v4) read its initial-value through var()
      */
      if (
        name === 'font-face' ||
        name === 'keyframes' ||
        name === 'viewport' ||
        name === 'property'
      ) {
        return
      }

      /* Case 3: @-rule with CSS rules inside [REMAIN] */
      // non matching media queries are stripped out in non-matching-media-query-remover.js
      if (
        name === 'media' ||
        name === 'document' ||
        name === 'supports' ||
        name === 'layer'
      ) {
        if (atrule.block && !atrule.block.children.isEmpty()) {
          return
        }
      }

      /* Case 5: @layer statement, f.e. `@layer theme, base;` [REMAIN]
         The first mention of a layer name fixes its cascade order, so a named
         @layer block whose rules were all removed is kept as a statement.
         (Not inside a style rule: browsers drop a nested @layer statement.)
      */
      if (name === 'layer' && atrule.prelude && !this.rule) {
        atrule.block = null
        return
      }

      // otherwise remove the at-rule
      list.remove(item)
    }
  })
}
