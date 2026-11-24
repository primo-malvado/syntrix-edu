export interface Edge {
  from: string;
  to: string;
  _ft_: string;
  _tt_: string;
}

export interface Machine {
  start: string[];
  end: string[];
  table: Edge[];
}

export interface SubsetRow {
  name: string;
  states: string[];
  accepting: boolean;
  moves: { symbol: string; direct: string[]; closure: string[]; target: string }[];
}

function sorted(states: Iterable<string>): string[] {
  return [...new Set(states)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function describeInput(input: string, alphabet: string[]): { length: number; withinAlphabet: boolean } {
  const symbols = [...input];
  return { length: symbols.length, withinAlphabet: symbols.every(symbol => alphabet.includes(symbol)) };
}

export function closure(machine: Machine, states: string[]): string[] {
  const found = new Set(states);
  const pending = [...states];
  while (pending.length) {
    const state = pending.pop()!;
    for (const edge of machine.table) {
      if (edge.from === state && edge._ft_ === 'ε' && edge._tt_ === 'ε' && !found.has(edge.to)) {
        found.add(edge.to);
        pending.push(edge.to);
      }
    }
  }
  return sorted(found);
}

// The laboratory uses a small explicit alphabet; each column is one character.
export function subsets(machine: Machine, alphabet: string[]): SubsetRow[] {
  const groups: string[][] = [closure(machine, machine.start)];
  const key = (states: string[]) => JSON.stringify(states);
  const names = new Map([[key(groups[0]), 'D0']]);
  const rows: SubsetRow[] = [];
  for (let i = 0; i < groups.length; i++) {
    const states = groups[i];
    const moves = alphabet.map(symbol => {
      const direct = sorted(machine.table
        .filter(edge => states.includes(edge.from) && edge._ft_ !== 'ε' &&
          edge._ft_ <= symbol && symbol <= edge._tt_)
        .map(edge => edge.to));
      const next = closure(machine, direct);
      if (!next.length) return { symbol, direct, closure: next, target: '∅' };
      const nextKey = key(next);
      if (!names.has(nextKey)) {
        names.set(nextKey, `D${groups.length}`);
        groups.push(next);
      }
      return { symbol, direct, closure: next, target: names.get(nextKey)! };
    });
    rows.push({ name: names.get(key(states))!, states, accepting: states.some(state => machine.end.includes(state)), moves });
  }
  return rows;
}

export function accepts(machine: Machine, input: string): boolean {
  let states = closure(machine, machine.start);
  for (const symbol of input) {
    const next = machine.table
      .filter(edge => states.includes(edge.from) && edge._ft_ !== 'ε' &&
        edge._ft_ <= symbol && symbol <= edge._tt_)
      .map(edge => edge.to);
    states = closure(machine, next);
  }
  return states.some(state => machine.end.includes(state));
}
