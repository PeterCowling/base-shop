/**
 * Graph Module - Dependency and network analysis primitives backed by Graphology.
 *
 * This adapter keeps graph analysis in the centralized math layer rather than
 * scattering direct third-party imports across the repo.
 */

export {
  DirectedGraph,
  default as Graph,
  InvalidArgumentsGraphError,
  MultiDirectedGraph,
  MultiGraph,
  MultiUndirectedGraph,
  NotFoundGraphError,
  UndirectedGraph,
  UsageGraphError,
} from "graphology";
export * as dag from "graphology-dag";
export * as metrics from "graphology-metrics";
export * as shortestPath from "graphology-shortest-path";
