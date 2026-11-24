/// <reference lib="webworker" />

import {
  Lexer, Parser, compileEbnfGrammar, createEbnfLexer, createEbnfParser,
  determinize, regexToNfa, type ParserConfig, type Automaton
} from 'syntrix';

import { accepts, describeInput, subsets } from './automata';
import { analyzeGrammar } from './grammar-analysis';
import { runParserTests } from './parser-tests';
import type { Job, Reply, Result } from './course-model';

const names = (text: string): string[] => text.split(/[\s,]+/).filter(Boolean);

function alphabetFor(machine: Automaton): string[] {
  const alphabet = new Set<string>();
  for (const edge of machine.table) {
    if (edge._ft_ === 'ε' && edge._tt_ === 'ε') continue;
    if (edge._ft_.length !== 1 || edge._tt_.length !== 1) throw new Error('Only single-character transitions are supported in this lab.');
    const first = edge._ft_.charCodeAt(0);
    const last = edge._tt_.charCodeAt(0);
    if (last < first || last - first > 63) throw new Error('A character range may contain at most 64 characters.');
    for (let code = first; code <= last; code++) alphabet.add(String.fromCharCode(code));
  }
  if (alphabet.size > 64) throw new Error('The lab supports at most 64 alphabet symbols.');
  return [...alphabet].sort();
}

function tokenize(lexer: Lexer, input: string): { type: string; value: string }[] {
  lexer.setInput(input);
  const output: { type: string; value: string }[] = [];
  while (true) {
    const token = lexer.nextToken();
    if (token === null) throw new Error('The lexer needs more input.');
    if (token.tokenType === 'eof') return output;
    output.push({ type: token.tokenType, value: String(token.content ?? '') });
    if (output.length > 10000) throw new Error('Input exceeds the 10,000-token limit.');
  }
}

function actionLabel(entry: [number, number], symbol: string): string {
  const [kind, target] = entry;
  if (kind === 0) return `s${target}`;
  if (kind === 1) return `r${target}`;
  if (kind === 2) return symbol === 'eof' ? 'acc' : String(target);
  return 'error';
}

function entries(entry: [number, number] | Array<[number, number]> | undefined): Array<[number, number]> {
  if (!entry || !entry.length) return [];
  return typeof entry[0] === 'number' ? [entry as [number, number]] : entry as Array<[number, number]>;
}

function lrTrace(table: ParserConfig, tokens: string[]): { stack: string; input: string; action: string }[] {
  const stack: (string | number)[] = [0];
  const remaining = [...tokens, 'eof'];
  const output: { stack: string; input: string; action: string }[] = [];
  for (let count = 0; count < 200; count++) {
    const state = stack.at(-1);
    if (typeof state !== 'number') throw new Error('Invalid parser state on the stack.');
    const symbol = remaining[0];
    const actions = entries(table.table[state]?.[symbol]);
    const snapshot = { stack: stack.join(' '), input: remaining.join(' ') };
    if (actions.length !== 1) {
      output.push({ ...snapshot, action: actions.length ? 'conflict: multiple actions' : `error on ${symbol}` });
      break;
    }
    const [kind, target] = actions[0];
    if (kind === 0) {
      output.push({ ...snapshot, action: `shift ${target}` });
      stack.push(symbol, target); remaining.shift();
    } else if (kind === 1) {
      const rule = table.states[target];
      if (!rule || stack.length <= rule.base.length * 2) throw new Error('Invalid reduction in parser table.');
      output.push({ ...snapshot, action: `reduce r${target}: ${rule.create} → ${rule.base.join(' ') || 'ε'}` });
      stack.splice(stack.length - rule.base.length * 2, rule.base.length * 2);
      const previous = stack.at(-1);
      if (typeof previous !== 'number') throw new Error('Invalid state after reduction.');
      const next = entries(table.table[previous]?.[rule.create]);
      if (next.length !== 1 || next[0][0] !== 2) throw new Error(`Missing goto for ${rule.create}.`);
      stack.push(rule.create, next[0][1]);
    } else if (kind === 2 && symbol === 'eof') {
      output.push({ ...snapshot, action: 'accept' });
      break;
    } else {
      output.push({ ...snapshot, action: 'error' });
      break;
    }
    if (count === 199) output.push({ stack: stack.join(' '), input: remaining.join(' '), action: 'Stopped after 200 steps.' });
  }
  return output;
}

function run(job: Job): Result {
  if (job.kind === 'automata') {
    if (job.regex.length > 200) throw new Error('Regular expressions are limited to 200 characters.');
    const nfa = regexToNfa(job.regex);
    const alphabet = alphabetFor(nfa);
    const dfa = determinize(nfa);
    const inputInfo = describeInput(job.input, alphabet);
    return { kind: 'automata', nfa, dfa, alphabet, input: job.input,
      inputLength: inputInfo.length, withinAlphabet: inputInfo.withinAlphabet, rows: subsets(nfa, alphabet),
      nfaAccepts: accepts(nfa, job.input), dfaAccepts: accepts(dfa, job.input) };
  }
  if (job.kind === 'grammar') {
    const grammar = compileEbnfGrammar(job.grammar, { start: job.start, tokens: names(job.tokens) });
    return { kind: 'grammar', analysis: analyzeGrammar(grammar, job.start, names(job.input)) };
  }
  if (job.kind === 'lexer') {
    const table = createEbnfLexer(job.lexer, { tokens: names(job.tokens) });
    return { kind: 'lexer', tokens: tokenize(new Lexer(table), job.input), transitions: table['INITIAL'].table };
  }
  if (job.kind === 'testing') {
    const lexerTable = createEbnfLexer(job.lexer, { tokens: names(job.lexerTokens) });
    const parserTable = createEbnfParser(job.grammar, {
      start: job.start, tokens: names(job.tokens), ignoreTokens: names(job.ignore), algorithm: 'lalr1'
    });
    return { kind: 'testing', cases: runParserTests(lexerTable, parserTable, job.cases),
      diagnostics: (parserTable.diagnostics ?? []).map(item => item.message) };
  }
  const lexerTable = createEbnfLexer(job.lexer, { tokens: names(job.lexerTokens) });
  const parserTable = createEbnfParser(job.grammar, {
    start: job.start, tokens: names(job.tokens), ignoreTokens: names(job.ignore), algorithm: job.algorithm
  });
  const states = Object.keys(parserTable.table);
  const columns = [...new Set(states.flatMap(state => Object.keys(parserTable.table[state])))];
  const nonterminals = new Set(parserTable.states.map(state => state.create));
  columns.sort((a, b) => Number(nonterminals.has(a)) - Number(nonterminals.has(b)) || a.localeCompare(b));
  const rows = states.map(state => ({
    state, cells: columns.map(symbol => entries(parserTable.table[state]?.[symbol])
      .map(entry => actionLabel(entry, symbol)).join(' / ') || '—')
  }));
  const graph: Automaton = {
    start: ['0'],
    end: states.filter(state => entries(parserTable.table[state]?.['eof']).some(entry => entry[0] === 2)),
    table: states.flatMap(state => Object.entries(parserTable.table[state]).flatMap(([symbol, entry]) =>
      entries(entry).filter(action => action[0] === 0 || (action[0] === 2 && nonterminals.has(symbol)))
        .map(action => ({ from: state, to: String(action[1]), _ft_: symbol, _tt_: symbol }))))
  };
  let tokens: { type: string; value: string }[] = [];
  let output = '';
  let parseError = '';
  let trace: { stack: string; input: string; action: string }[] = [];
  try {
    tokens = tokenize(new Lexer(lexerTable), job.input);
    const visible = tokens.filter(token => !names(job.ignore).includes(token.type));
    if (job.algorithm !== 'glr') trace = lrTrace(parserTable, visible.map(token => token.type));
    const result = new Parser(new Lexer(lexerTable), parserTable).parse(job.input);
    output = JSON.stringify(result, null, 2) ?? String(result);
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  return {
    kind: 'parser', tokens, graph, columns, rows, trace, output, parseError,
    productions: parserTable.states.map((production, id) => ({ id, lhs: production.create, rhs: production.base })),
    diagnostics: (parserTable.diagnostics ?? []).map(item => item.message)
  };
}

addEventListener('message', ({ data }: MessageEvent<Job>) => {
  try {
    const reply: Reply = { ok: true, result: run(data) };
    postMessage(reply);
  } catch (error) {
    const reply: Reply = { ok: false, error: error instanceof Error ? error.message : String(error) };
    postMessage(reply);
  }
});
