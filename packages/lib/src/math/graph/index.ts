import { DirectedGraph } from "graphology";
import { hasCycle, topologicalGenerations } from "graphology-dag";
import betweennessCentrality from "graphology-metrics/centrality/betweenness";

export interface DependencyNodeInput {
  id: string;
}

export interface DependencyEdgeInput {
  from: string;
  to: string;
}

export interface DependencyGraphInput {
  nodes: readonly DependencyNodeInput[];
  edges: readonly DependencyEdgeInput[];
}

export interface DependencyGraphCriticalPath {
  length: number;
  node_ids: string[];
}

export interface DependencyGraphAnalysis {
  node_ids: string[];
  edge_count: number;
  roots: string[];
  leaves: string[];
  topological_order: string[];
  generations: string[][];
  critical_path: DependencyGraphCriticalPath;
  bottleneck_scores: Array<{ node_id: string; score: number }>;
}

export class DependencyGraphValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DependencyGraphValidationError";
  }
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function normalizeNodes(nodes: readonly DependencyNodeInput[]): DependencyNodeInput[] {
  const normalized = nodes.map((node) => {
    if (typeof node.id !== "string" || node.id.trim().length === 0) {
      throw new DependencyGraphValidationError("node_id_required");
    }

    return { id: node.id.trim() };
  });

  normalized.sort((left, right) => compareStrings(left.id, right.id));

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index - 1]?.id === normalized[index]?.id) {
      throw new DependencyGraphValidationError(
        `duplicate_node_id:${normalized[index]?.id}`,
      );
    }
  }

  return normalized;
}

function normalizeEdges(
  edges: readonly DependencyEdgeInput[],
  nodeIds: ReadonlySet<string>,
): DependencyEdgeInput[] {
  const normalized = edges.map((edge) => {
    if (typeof edge.from !== "string" || edge.from.trim().length === 0) {
      throw new DependencyGraphValidationError("edge_from_required");
    }
    if (typeof edge.to !== "string" || edge.to.trim().length === 0) {
      throw new DependencyGraphValidationError("edge_to_required");
    }

    const from = edge.from.trim();
    const to = edge.to.trim();

    if (!nodeIds.has(from)) {
      throw new DependencyGraphValidationError(`unknown_edge_from:${from}`);
    }
    if (!nodeIds.has(to)) {
      throw new DependencyGraphValidationError(`unknown_edge_to:${to}`);
    }
    if (from === to) {
      throw new DependencyGraphValidationError(`self_cycle_edge:${from}`);
    }

    return { from, to };
  });

  normalized.sort((left, right) => {
    const fromComparison = compareStrings(left.from, right.from);
    if (fromComparison !== 0) {
      return fromComparison;
    }
    return compareStrings(left.to, right.to);
  });

  for (let index = 1; index < normalized.length; index += 1) {
    const previous = normalized[index - 1];
    const current = normalized[index];
    if (previous && current && previous.from === current.from && previous.to === current.to) {
      throw new DependencyGraphValidationError(
        `duplicate_edge:${current.from}->${current.to}`,
      );
    }
  }

  return normalized;
}

function buildGraph(input: DependencyGraphInput): DirectedGraph {
  const graph = new DirectedGraph();
  const nodes = normalizeNodes(input.nodes);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = normalizeEdges(input.edges, nodeIds);

  for (const node of nodes) {
    graph.addNode(node.id);
  }

  for (const edge of edges) {
    graph.addDirectedEdge(edge.from, edge.to);
  }

  if (hasCycle(graph)) {
    throw new DependencyGraphValidationError("graph_contains_cycle");
  }

  return graph;
}

function computeCriticalPath(
  graph: DirectedGraph,
  topologicalOrder: readonly string[],
): DependencyGraphCriticalPath {
  const distanceByNode = new Map<string, number>();
  const predecessorByNode = new Map<string, string | null>();

  for (const nodeId of topologicalOrder) {
    const parents = graph
      .inNeighbors(nodeId)
      .slice()
      .sort(compareStrings);

    if (parents.length === 0) {
      distanceByNode.set(nodeId, 0);
      predecessorByNode.set(nodeId, null);
      continue;
    }

    let bestParent = parents[0] ?? null;
    let bestDistance = -1;

    for (const parentId of parents) {
      const parentDistance = distanceByNode.get(parentId);
      if (parentDistance == null) {
        continue;
      }

      if (parentDistance > bestDistance) {
        bestDistance = parentDistance;
        bestParent = parentId;
        continue;
      }

      if (parentDistance === bestDistance && bestParent && compareStrings(parentId, bestParent) < 0) {
        bestParent = parentId;
      }
    }

    distanceByNode.set(nodeId, bestDistance + 1);
    predecessorByNode.set(nodeId, bestParent);
  }

  const orderedLeaves = topologicalOrder
    .filter((nodeId) => graph.outDegree(nodeId) === 0)
    .slice()
    .sort(compareStrings);

  let bestLeaf = orderedLeaves[0] ?? topologicalOrder[0] ?? null;
  let bestLength = bestLeaf ? (distanceByNode.get(bestLeaf) ?? 0) : 0;

  for (const leafId of orderedLeaves) {
    const candidateLength = distanceByNode.get(leafId) ?? 0;
    if (candidateLength > bestLength) {
      bestLeaf = leafId;
      bestLength = candidateLength;
      continue;
    }
    if (
      candidateLength === bestLength &&
      bestLeaf &&
      compareStrings(leafId, bestLeaf) < 0
    ) {
      bestLeaf = leafId;
    }
  }

  const nodeIds: string[] = [];
  let cursor: string | null = bestLeaf;
  while (cursor) {
    nodeIds.push(cursor);
    cursor = predecessorByNode.get(cursor) ?? null;
  }
  nodeIds.reverse();

  return {
    length: bestLength,
    node_ids: nodeIds,
  };
}

export function analyzeDependencyGraph(
  input: DependencyGraphInput,
): DependencyGraphAnalysis {
  const graph = buildGraph(input);

  const generations = topologicalGenerations(graph).map((generation) =>
    generation.slice().sort(compareStrings),
  );
  const topologicalOrder = generations.flat();

  const roots = graph
    .nodes()
    .filter((nodeId) => graph.inDegree(nodeId) === 0)
    .sort(compareStrings);
  const leaves = graph
    .nodes()
    .filter((nodeId) => graph.outDegree(nodeId) === 0)
    .sort(compareStrings);

  const centrality = betweennessCentrality(graph, { normalized: true });
  const bottleneckScores = graph
    .nodes()
    .map((nodeId) => ({
      node_id: nodeId,
      score: centrality[nodeId] ?? 0,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return compareStrings(left.node_id, right.node_id);
    });

  return {
    node_ids: graph.nodes().slice().sort(compareStrings),
    edge_count: graph.size,
    roots,
    leaves,
    topological_order: topologicalOrder,
    generations,
    critical_path: computeCriticalPath(graph, topologicalOrder),
    bottleneck_scores: bottleneckScores,
  };
}
