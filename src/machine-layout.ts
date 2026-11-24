import dagre, { type GraphEdge } from '@dagrejs/dagre';
import type { Automaton } from 'syntrix';

interface Point {
  x: number;
  y: number;
}

export interface DiagramNode extends Point {
  id: string;
  start: boolean;
  accepting: boolean;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label: string;
  points: Point[];
  x: number;
  y: number;
}

export interface MachineLayout {
  width: number;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  starts: Point[][];
}

const radius = 21;
const stateKey = (id: string) => `state:${id}`;
const visible = (value: string) => /^\s+$/.test(value) ? JSON.stringify(value) : value;

function boundary(center: Point, toward: Point): Point {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const length = Math.hypot(dx, dy);
  if (!length) throw new Error('Dagre returned an invalid transition direction.');
  return { x: center.x + radius * dx / length, y: center.y + radius * dy / length };
}

function routedPoints(edge: GraphEdge, from: Point | null, to: Point): Point[] {
  if (!edge.points || edge.points.length < 2) throw new Error('Dagre did not return a transition route.');
  const points = edge.points.map(point => ({ ...point }));
  if (from) points[0] = boundary(from, points[1]);
  points[points.length - 1] = boundary(to, points[points.length - 2]);
  return points;
}

export function layoutMachine(machine: Automaton): MachineLayout {
  const ids = [...new Set([...machine.start, ...machine.end,
    ...machine.table.flatMap(edge => [edge.from, edge.to])])]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (!ids.length) return { width: 100, height: 100, nodes: [], edges: [], starts: [] };

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: 'LR', nodesep: 36, ranksep: 55, edgesep: 20, marginx: 32, marginy: 32 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const id of ids) graph.setNode(stateKey(id), { width: 46, height: 46 });

  const grouped = new Map<string, { from: string; to: string; labels: string[] }>();
  for (const edge of machine.table) {
    const key = JSON.stringify([edge.from, edge.to]);
    const group = grouped.get(key) ?? { from: edge.from, to: edge.to, labels: [] };
    const label = edge._ft_ === edge._tt_ ? visible(edge._ft_) : `${visible(edge._ft_)}–${visible(edge._tt_)}`;
    if (!group.labels.includes(label)) group.labels.push(label);
    grouped.set(key, group);
  }
  for (const edge of grouped.values()) {
    const label = edge.labels.join(', ');
    graph.setEdge(stateKey(edge.from), stateKey(edge.to), {
      width: Math.max(20, label.length * 8), height: 18, labelpos: 'c'
    });
  }
  const starts = [...new Set(machine.start)];
  starts.forEach((id, index) => {
    graph.setNode(`start:${index}`, { width: 1, height: 1 });
    graph.setEdge(`start:${index}`, stateKey(id), { width: 0, height: 0 });
  });

  dagre.layout(graph);
  const nodes = ids.map(id => {
    const node = graph.node(stateKey(id));
    if (node.x === undefined || node.y === undefined) throw new Error(`Dagre did not position state ${id}.`);
    return { id, x: node.x, y: node.y, start: starts.includes(id), accepting: machine.end.includes(id) };
  });
  const byId = new Map(nodes.map(node => [node.id, node]));
  const edges = [...grouped.values()].map(edge => {
    const route = graph.edge(stateKey(edge.from), stateKey(edge.to));
    if (!route || typeof route.x !== 'number' || typeof route.y !== 'number') {
      throw new Error(`Dagre did not position the transition ${edge.from} → ${edge.to}.`);
    }
    return { from: edge.from, to: edge.to, label: edge.labels.join(', '), x: route.x, y: route.y,
      points: routedPoints(route, byId.get(edge.from)!, byId.get(edge.to)!) };
  });
  const startPaths = starts.map((id, index) => {
    const route = graph.edge(`start:${index}`, stateKey(id));
    if (!route) throw new Error(`Dagre did not route the start arrow for ${id}.`);
    return routedPoints(route, null, byId.get(id)!);
  });
  const dimensions = graph.graph();
  if (dimensions.width === undefined || dimensions.height === undefined) {
    throw new Error('Dagre did not return diagram dimensions.');
  }
  // Dagre's bounds can exclude the horizontal extent of self-loop labels.
  const minX = Math.min(0, ...edges.map(edge => edge.x - Math.max(20, edge.label.length * 8) / 2 - 12));
  const maxX = Math.max(dimensions.width, ...edges.map(edge => edge.x + Math.max(20, edge.label.length * 8) / 2 + 12));
  if (minX < 0) {
    for (const node of nodes) node.x -= minX;
    for (const edge of edges) {
      edge.x -= minX;
      for (const point of edge.points) point.x -= minX;
    }
    for (const start of startPaths) for (const point of start) point.x -= minX;
  }
  return { width: maxX - minX, height: dimensions.height, nodes, edges, starts: startPaths };
}

export function pathData(points: Point[]): string {
  if (!points.length) return '';
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
}
