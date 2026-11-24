import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accepts, closure, describeInput, subsets } from '../src/automata.ts';
import { layoutMachine, pathData } from '../src/machine-layout.ts';

const machine = {
  start: ['0'],
  end: ['3'],
  table: [
    { from: '0', to: '1', _ft_: 'ε', _tt_: 'ε' },
    { from: '1', to: '0', _ft_: 'ε', _tt_: 'ε' },
    { from: '1', to: '2', _ft_: 'a', _tt_: 'a' },
    { from: '2', to: '3', _ft_: 'ε', _tt_: 'ε' },
    { from: '3', to: '3', _ft_: 'b', _tt_: 'b' }
  ]
};

test('input description distinguishes alphabet membership from language acceptance', () => {
  assert.deepEqual(describeInput('', ['a', 'b']), { length: 0, withinAlphabet: true });
  assert.deepEqual(describeInput('ba', ['a', 'b']), { length: 2, withinAlphabet: true });
  assert.equal(accepts(machine, 'ba'), false);
  assert.deepEqual(describeInput('a😀', ['a', 'b']), { length: 2, withinAlphabet: false });
});

test('epsilon closure terminates on cycles and keeps the starting states', () => {
  assert.deepEqual(closure(machine, ['0']), ['0', '1']);
  assert.deepEqual(closure(machine, ['2']), ['2', '3']);
  assert.deepEqual(closure(machine, []), []);
});

test('subset construction shows direct moves, closures, acceptance and missing transitions', () => {
  const rows = subsets(machine, ['a', 'b']);
  assert.deepEqual(rows[0], {
    name: 'D0', states: ['0', '1'], accepting: false,
    moves: [
      { symbol: 'a', direct: ['2'], closure: ['2', '3'], target: 'D1' },
      { symbol: 'b', direct: [], closure: [], target: '∅' }
    ]
  });
  assert.equal(rows[1].accepting, true);
  assert.equal(rows[1].moves[1].target, 'D2');
  assert.equal(rows[2].moves[1].target, 'D2');
});

test('simulation handles empty input, epsilon transitions and ranges', () => {
  assert.equal(accepts(machine, ''), false);
  assert.equal(accepts(machine, 'a'), true);
  assert.equal(accepts(machine, 'abb'), true);
  assert.equal(accepts(machine, 'ba'), false);
  assert.equal(accepts({ start: ['0'], end: ['1'], table: [
    { from: '0', to: '1', _ft_: 'a', _tt_: 'c' }
  ] }, 'b'), true);
});

test('worked epsilon-NFA yields the documented subset construction', () => {
  const example = {
    start: ['0'], end: ['3'], table: [
      { from: '0', to: '1', _ft_: 'ε', _tt_: 'ε' },
      { from: '1', to: '2', _ft_: 'a', _tt_: 'a' },
      { from: '2', to: '1', _ft_: 'ε', _tt_: 'ε' },
      { from: '2', to: '3', _ft_: 'ε', _tt_: 'ε' }
    ]
  };
  const rows = subsets(example, ['a']);
  assert.deepEqual(rows.map(row => [row.states, row.accepting, row.moves[0].target]), [
    [['0', '1'], false, 'D1'], [['1', '2', '3'], true, 'D1']
  ]);
  assert.equal(accepts(example, ''), false);
  assert.equal(accepts(example, 'aa'), true);
});

test('Dagre routes grouped transitions, reverse edges, loops and multiple start states', () => {
  const diagram = layoutMachine({
    start: ['0', '2'], end: ['1', '3'],
    table: [
      { from: '0', to: '1', _ft_: 'a', _tt_: 'a' },
      { from: '0', to: '1', _ft_: 'b', _tt_: 'b' },
      { from: '1', to: '0', _ft_: 'c', _tt_: 'c' },
      { from: '1', to: '1', _ft_: ' ', _tt_: ' ' },
      { from: '2', to: '1', _ft_: 'd', _tt_: 'f' }
    ]
  });
  assert.equal(diagram.nodes.length, 4);
  assert.equal(diagram.starts.length, 2);
  assert.deepEqual(diagram.nodes.filter(node => node.accepting).map(node => node.id), ['1', '3']);
  assert.deepEqual(diagram.edges.map(edge => edge.label), ['a, b', 'c', '" "', 'd–f']);
  assert.ok(diagram.nodes.find(node => node.id === '1').x > diagram.nodes.find(node => node.id === '0').x);
  const loop = diagram.edges.find(edge => edge.from === '1' && edge.to === '1');
  const loopNode = diagram.nodes.find(node => node.id === '1');
  assert.ok(loop.points.length > 2);
  assert.ok(loop.points[0].x < loopNode.x && loop.points.at(-1).x > loopNode.x);
  assert.ok(loop.points.some(point => point.x < loop.points[0].x));
  assert.ok(loop.points.some(point => point.x > loop.points.at(-1).x));
  for (const edge of diagram.edges) {
    assert.match(pathData(edge.points), /^M .+ L /);
    for (const point of edge.points) {
      assert.ok(point.x >= 0 && point.x <= diagram.width && point.y >= 0 && point.y <= diagram.height);
    }
    for (const [point, id] of [[edge.points[0], edge.from], [edge.points.at(-1), edge.to]]) {
      const node = diagram.nodes.find(item => item.id === id);
      assert.ok(Math.abs(Math.hypot(point.x - node.x, point.y - node.y) - 21) < 0.0001);
    }
    assert.ok(edge.x >= 0 && edge.x <= diagram.width && edge.y >= 0 && edge.y <= diagram.height);
  }
});

test('long self-loop labels fit within the diagram bounds', () => {
  const diagram = layoutMachine({
    start: ['0'], end: ['0'],
    table: Array.from('abcdefghijklmnopqrstuvwxyz', symbol => ({
      from: '0', to: '0', _ft_: symbol, _tt_: symbol
    }))
  });
  const edge = diagram.edges[0];
  const halfWidth = edge.label.length * 4;
  assert.ok(edge.x - halfWidth >= 0);
  assert.ok(edge.x + halfWidth <= diagram.width);
});

test('Dagre layout handles a machine with no states', () => {
  const diagram = layoutMachine({ start: [], end: [], table: [] });
  assert.deepEqual(diagram.nodes, []);
  assert.deepEqual(diagram.edges, []);
  assert.deepEqual(diagram.starts, []);
  assert.ok(diagram.width > 0 && diagram.height > 0);
});
