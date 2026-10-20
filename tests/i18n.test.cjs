const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const source = readFileSync('src/i18n.js', 'utf8');
const ast = parser.parse(source, { sourceType: 'module' });
const declaration = ast.program.body.find(
  (node) => node.type === 'VariableDeclaration' && node.declarations[0].id.name === 'resources',
).declarations[0].init;
const resources = vm.runInNewContext(`(${source.slice(declaration.start, declaration.end)})`);
const keys = Object.keys(resources.en.translation);

test('all languages contain the same non-empty messages and interpolation fields', () => {
  for (const locale of ['en', 'kk', 'ru']) {
    const messages = resources[locale].translation;
    assert.deepEqual(Object.keys(messages).sort(), [...keys].sort(), locale);
    for (const key of keys) {
      if (typeof messages[key] !== 'string') {
        assert.deepEqual(
          Object.keys(messages[key]).sort(),
          Object.keys(resources.en.translation[key]).sort(),
          `${locale}:${key}`,
        );
        continue;
      }
      assert.ok(messages[key].trim(), `${locale}:${key}`);
      const fields = (value) =>
        [...value.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1]).sort();
      assert.deepEqual(
        fields(messages[key]),
        fields(resources.en.translation[key]),
        `${locale}:${key}`,
      );
    }
  }
});

test('static translation calls, including conditional keys, resolve in every language', () => {
  const failures = [];
  function checkRenderedText(node, file) {
    if (!node) return;
    if (node.type === 'StringLiteral' && /\p{L}/u.test(node.value))
      failures.push(`${file}: untranslated rendered string`);
    if (
      node.type === 'TemplateLiteral' &&
      node.quasis.some((part) => /\p{L}/u.test(part.value.raw))
    )
      failures.push(`${file}: untranslated rendered template`);
    if (node.type === 'ConditionalExpression') {
      checkRenderedText(node.consequent, file);
      checkRenderedText(node.alternate, file);
    }
    if (node.type === 'LogicalExpression') checkRenderedText(node.right, file);
    if (node.type === 'BinaryExpression' && node.operator === '+') {
      checkRenderedText(node.left, file);
      checkRenderedText(node.right, file);
    }
  }
  function checkKey(node, file) {
    if (node?.type === 'StringLiteral' && !keys.includes(node.value))
      failures.push(`${file}: ${node.value}`);
    if (node?.type === 'ConditionalExpression') {
      checkKey(node.consequent, file);
      checkKey(node.alternate, file);
    }
  }
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(file);
        continue;
      }
      if (!/\.(js|jsx)$/.test(file)) continue;
      const tree = parser.parse(readFileSync(file, 'utf8'), {
        sourceType: 'module',
        plugins: ['jsx'],
      });
      traverse(tree, {
        CallExpression({ node }) {
          if (node.callee.name === 't' || node.callee.property?.name === 't')
            checkKey(node.arguments[0], file);
          if (
            ['alert', 'confirm', 'prompt'].includes(node.callee.name) ||
            node.callee.property?.name === 'fillText'
          )
            checkRenderedText(node.arguments[0], file);
          if (
            ['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString'].includes(
              node.callee.property?.name,
            ) &&
            node.arguments[0]?.type === 'StringLiteral'
          )
            failures.push(`${file}: hardcoded formatting locale`);
        },
        JSXExpressionContainer({ node, parent }) {
          if (
            parent.type === 'JSXElement' &&
            !['style', 'script'].includes(parent.openingElement.name.name)
          )
            checkRenderedText(node.expression, file);
        },
        AssignmentPattern({ node }) {
          if (['text', 'title', 'label', 'placeholder'].includes(node.left.name))
            checkRenderedText(node.right, file);
        },
        JSXText({ node }) {
          if (/[\p{L}]/u.test(node.value.trim())) failures.push(`${file}: untranslated JSX text`);
        },
        JSXAttribute({ node }) {
          if (
            ['title', 'alt', 'placeholder', 'aria-label'].includes(node.name.name) &&
            node.value?.type === 'StringLiteral' &&
            /\p{L}/u.test(node.value.value)
          ) {
            failures.push(`${file}: untranslated ${node.name.name}`);
          }
        },
      });
    }
  }
  visit('src');
  assert.deepEqual(failures, []);
});
