import type { ParserRules } from 'syntrix';

export interface Production {
  id: number;
  lhs: string;
  rhs: string[];
}

export interface PredictiveRow {
  nonterminal: string;
  cells: { terminal: string; productions: number[] }[];
}

export interface PredictiveStep {
  stack: string;
  input: string;
  action: string;
}

export interface GrammarAnalysis {
  productions: Production[];
  first: { symbol: string; values: string[] }[];
  follow: { symbol: string; values: string[] }[];
  terminals: string[];
  table: PredictiveRow[];
  rounds: string[];
  trace: PredictiveStep[];
  traceError: string;
}

const epsilon = 'ε';
const end = 'eof';

export function analyzeGrammar(grammar: ParserRules, start: string, input: string[]): GrammarAnalysis {
  const nonterminals = Object.keys(grammar.states);
  if (!nonterminals.includes(start)) throw new Error(`Unknown start rule: ${start}`);
  if (input.includes(end)) throw new Error('Do not include eof in the input; the lab adds the end marker automatically.');
  const productions: Production[] = [];
  for (const [lhs, definition] of Object.entries(grammar.states)) {
    for (const production of definition.rules) {
      productions.push({ id: productions.length, lhs, rhs: production.rule });
    }
  }
  const terminals = [...new Set(productions.flatMap(p => p.rhs).filter(s => !nonterminals.includes(s)))].sort();
  if (terminals.includes(epsilon)) throw new Error('The ε symbol is reserved for empty productions in this lab.');
  const first = new Map(nonterminals.map(name => [name, new Set<string>()]));
  const follow = new Map(nonterminals.map(name => [name, new Set<string>()]));
  if (!follow.has(grammar.start)) throw new Error(`Unknown compiled start rule: ${grammar.start}`);
  follow.get(grammar.start)!.add(end);
  const rounds: string[] = [`FOLLOW seed: ${grammar.start} += {${end}}`];
  const add = (target: Set<string>, values: Iterable<string>): boolean => {
    let changed = false;
    for (const value of values) if (!target.has(value)) { target.add(value); changed = true; }
    return changed;
  };
  const firstOf = (symbols: string[]): Set<string> => {
    const result = new Set<string>();
    for (const symbol of symbols) {
      const values = first.get(symbol) ?? new Set([symbol]);
      add(result, [...values].filter(value => value !== epsilon));
      if (!values.has(epsilon)) return result;
    }
    result.add(epsilon);
    return result;
  };
  let changed = true;
  let round = 0;
  while (changed) {
    changed = false;
    const updates: string[] = [];
    for (const production of productions) {
      const target = first.get(production.lhs)!;
      const before = new Set(target);
      if (add(target, firstOf(production.rhs))) {
        changed = true;
        updates.push(`${production.lhs} += {${[...target].filter(value => !before.has(value)).join(', ')}} via p${production.id}`);
      }
    }
    if (updates.length) rounds.push(`FIRST ${++round}: ${updates.join(', ')}`);
  }
  changed = true;
  round = 0;
  while (changed) {
    changed = false;
    const updates: string[] = [];
    for (const production of productions) {
      production.rhs.forEach((symbol, index) => {
        const target = follow.get(symbol);
        if (!target) return;
        const tail = firstOf(production.rhs.slice(index + 1));
        const values = [...tail].filter(value => value !== epsilon);
        if (tail.has(epsilon)) values.push(...follow.get(production.lhs)!);
        const before = new Set(target);
        if (add(target, values)) {
          changed = true;
          updates.push(`${symbol} += {${[...target].filter(value => !before.has(value)).join(', ')}} via p${production.id}`);
        }
      });
    }
    if (updates.length) rounds.push(`FOLLOW ${++round}: ${updates.join(', ')}`);
  }
  const columns = [...terminals, end];
  const table = nonterminals.map(nonterminal => ({
    nonterminal,
    cells: columns.map(terminal => ({ terminal, productions: [] as number[] }))
  }));
  for (const production of productions) {
    const lookaheads = firstOf(production.rhs);
    if (lookaheads.delete(epsilon)) add(lookaheads, follow.get(production.lhs)!);
    const row = table.find(item => item.nonterminal === production.lhs)!;
    for (const lookahead of lookaheads) row.cells.find(cell => cell.terminal === lookahead)?.productions.push(production.id);
  }
  const trace: PredictiveStep[] = [];
  let traceError = '';
  const stack = [end, start];
  const remaining = [...input, end];
  for (let count = 0; count < 200; count++) {
    const top = stack.at(-1)!;
    const next = remaining[0];
    const snapshot = { stack: stack.join(' '), input: remaining.join(' ') };
    if (top === end && next === end) {
      trace.push({ ...snapshot, action: 'accept' });
      break;
    }
    if (!first.has(top)) {
      if (top !== next) {
        traceError = `Expected ${top}, found ${next ?? 'end of input'}.`;
        trace.push({ ...snapshot, action: traceError });
        break;
      }
      stack.pop(); remaining.shift();
      trace.push({ ...snapshot, action: `match ${top}` });
    } else {
      const choices = table.find(row => row.nonterminal === top)?.cells.find(cell => cell.terminal === next)?.productions ?? [];
      if (choices.length !== 1) {
        traceError = choices.length ? `Conflict at ${top}, ${next}.` : `No production for ${top} on ${next ?? 'end of input'}.`;
        trace.push({ ...snapshot, action: traceError });
        break;
      }
      const production = productions[choices[0]];
      stack.pop();
      stack.push(...[...production.rhs].reverse());
      trace.push({ ...snapshot, action: `${production.lhs} → ${production.rhs.join(' ') || epsilon}` });
    }
    if (count === 199) traceError = 'Stopped after 200 steps; check for left recursion or a non-terminating grammar.';
  }
  const render = (map: Map<string, Set<string>>) => nonterminals.map(symbol => ({
    symbol, values: [...map.get(symbol)!].sort()
  }));
  return { productions, first: render(first), follow: render(follow), terminals: columns, table, rounds, trace, traceError };
}
