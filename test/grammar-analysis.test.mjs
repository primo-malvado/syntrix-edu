import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileEbnfGrammar, createEbnfLexer, createEbnfParser, Lexer } from 'syntrix';
import { analyzeGrammar } from '../src/grammar-analysis.ts';
import { parseTestCases, runParserTests } from '../src/parser-tests.ts';
import { studyGuides } from '../src/course-study.ts';

function analysis(source, tokens, input = []) {
  const grammar = compileEbnfGrammar(source, { start: 'entry', tokens });
  return analyzeGrammar(grammar, 'entry', input);
}

test('computes nullable FIRST and FOLLOW and uses FOLLOW in predictive table', () => {
  const result = analysis('entry = prefix, B; prefix = A, prefix | "";', ['A', 'B'], ['A', 'B']);
  const first = Object.fromEntries(result.first.map(row => [row.symbol, row.values]));
  const follow = Object.fromEntries(result.follow.map(row => [row.symbol, row.values]));
  assert.deepEqual(first.entry, ['A', 'B']);
  assert.deepEqual(first.prefix, ['A', 'ε']);
  assert.deepEqual(follow.prefix, ['B']);
  assert.deepEqual(follow.entry, ['eof']);
  assert.deepEqual(follow.__ebnf_0, ['eof']);
  const epsilon = result.productions.find(p => p.lhs === 'prefix' && !p.rhs.length);
  assert.deepEqual(result.table.find(row => row.nonterminal === 'prefix')
    .cells.find(cell => cell.terminal === 'B').productions, [epsilon.id]);
  assert.equal(result.trace.at(-1).action, 'accept');
  assert.match(result.rounds.join(' '), /prefix \+= \{ε\}/);
});

test('reports LL conflicts and rejects unexpected token sequences', () => {
  const conflict = analysis('entry = A | A, B;', ['A', 'B'], ['A']);
  assert.equal(conflict.table.find(row => row.nonterminal === 'entry')
    .cells.find(cell => cell.terminal === 'A').productions.length, 2);
  assert.match(conflict.traceError, /Conflict/);
  const invalid = analysis('entry = A, B;', ['A', 'B'], ['A', 'A']);
  assert.match(invalid.traceError, /Expected B/);
});

test('accepts empty input for nullable start including the synthetic rule', () => {
  const result = analysis('entry = "";', [], []);
  const root = result.table.find(row => row.nonterminal === '__ebnf_0');
  assert.equal(root.cells.find(cell => cell.terminal === 'eof').productions.length, 1);
  assert.equal(result.trace.at(-1).action, 'accept');
});

test('does not accept an explicitly supplied end marker before remaining input', () => {
  assert.throws(() => analysis('entry = "";', [], ['eof', 'A']), /adds the end marker/);
});

test('parser test cases preserve input and reject invalid case definitions', () => {
  assert.deepEqual(parseTestCases('accept: a \r\nreject:\n'), [
    { expected: 'accept', input: ' a ' }, { expected: 'reject', input: '' }
  ]);
  assert.throws(() => parseTestCases('accept'), /line 1/);
  assert.throws(() => parseTestCases(' \n'), /at least one/);
  assert.throws(() => parseTestCases('accept:a\n'.repeat(101)), /100 test cases/);
});

test('parser test suite distinguishes lexical, syntax and expectation failures', () => {
  const lexer = createEbnfLexer('A = "a";', { tokens: ['A'] });
  const parser = createEbnfParser('entry = A;', { start: 'entry', tokens: ['A'], algorithm: 'lalr1' });
  const results = runParserTests(lexer, parser, 'accept:a\nreject:\nreject:b\naccept:\nreject:a');
  assert.deepEqual(results.map(({ outcome, passed }) => [outcome, passed]), [
    ['accepted', true], ['syntax error', true], ['lexical error', true],
    ['syntax error', false], ['accepted', false]
  ]);
  assert.ok(results[1].message);
  assert.ok(results[2].message);
});

test('semantic-action failures cannot satisfy an expected rejection', () => {
  const lexer = createEbnfLexer('A = "a";', { tokens: ['A'] });
  const parser = createEbnfParser('entry = A { $$ = $1; throw new Error("broken action"); };', {
    start: 'entry', tokens: ['A'], algorithm: 'lalr1'
  });
  const [result] = runParserTests(lexer, parser, 'reject:a');
  assert.equal(result.outcome, 'execution error');
  assert.equal(result.passed, false);
  assert.match(result.message, /broken action/);
});

test('worked lexer example honors longest match before rule priority', () => {
  const preset = studyGuides.lexing.example.preset;
  assert.equal(preset.kind, 'lexer');
  const tokenize = tokens => {
    const lexer = new Lexer(createEbnfLexer(preset.lexer, { tokens }));
    lexer.setInput(preset.input);
    const result = [];
    for (let token = lexer.nextToken(); token && token.tokenType !== 'eof'; token = lexer.nextToken()) {
      result.push([token.tokenType, token.content]);
    }
    return result;
  };
  assert.deepEqual(tokenize(['IF', 'ID', 'SPACE']), [['IF', 'if'], ['SPACE', ' '], ['ID', 'ifx']]);
  assert.deepEqual(tokenize(['ID', 'IF', 'SPACE']), [['ID', 'if'], ['SPACE', ' '], ['ID', 'ifx']]);
});

test('worked predictive example produces the explained sets and trace', () => {
  const preset = studyGuides.predictive.example.preset;
  assert.equal(preset.kind, 'grammar');
  const result = analysis(preset.grammar, preset.tokens.split(' '), preset.input.split(' '));
  assert.deepEqual(result.first.find(row => row.symbol === 'entry').values, ['A', 'B']);
  assert.deepEqual(result.first.find(row => row.symbol === 'prefix').values, ['A', 'ε']);
  assert.deepEqual(result.follow.find(row => row.symbol === 'prefix').values, ['B']);
  assert.equal(result.trace.at(-1).action, 'accept');
});
