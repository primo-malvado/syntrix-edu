import type { Automaton, ParserAlgorithm } from 'syntrix';
import type { GrammarAnalysis } from './grammar-analysis';
import type { SubsetRow } from './automata';
import type { ParserTestResult } from './parser-tests';

export type Job =
  | { kind: 'automata'; regex: string; input: string }
  | { kind: 'grammar'; grammar: string; start: string; tokens: string; input: string }
  | { kind: 'lexer'; lexer: string; tokens: string; input: string }
  | { kind: 'parser'; lexer: string; lexerTokens: string; grammar: string; start: string; tokens: string; ignore: string; input: string; algorithm: ParserAlgorithm }
  | { kind: 'testing'; lexer: string; lexerTokens: string; grammar: string; start: string; tokens: string; ignore: string; cases: string };

export interface AutomataResult {
  kind: 'automata';
  nfa: Automaton;
  dfa: Automaton;
  alphabet: string[];
  input: string;
  inputLength: number;
  withinAlphabet: boolean;
  rows: SubsetRow[];
  nfaAccepts: boolean;
  dfaAccepts: boolean;
}
export interface GrammarResult { kind: 'grammar'; analysis: GrammarAnalysis }
export interface LexerResult { kind: 'lexer'; tokens: { type: string; value: string }[]; transitions: Automaton['table'] }
export interface ParserResult {
  kind: 'parser';
  tokens: { type: string; value: string }[];
  graph: Automaton;
  columns: string[];
  rows: { state: string; cells: string[] }[];
  productions: { id: number; lhs: string; rhs: string[] }[];
  trace: { stack: string; input: string; action: string }[];
  output: string;
  parseError: string;
  diagnostics: string[];
}
export interface TestingResult { kind: 'testing'; cases: ParserTestResult[]; diagnostics: string[] }
export type Result = AutomataResult | GrammarResult | LexerResult | ParserResult | TestingResult;
export type Reply = { ok: true; result: Result } | { ok: false; error: string };
