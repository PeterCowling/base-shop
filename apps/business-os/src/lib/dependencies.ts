/**
 * Dependency tracking and cycle detection
 *
 * Implements BOS-20: DFS-based cycle detection for card dependencies
 */

import type { Card } from "./types";

/**
 * Adjacency list representation: cardId -> array of cardIds it depends on
 */
type AdjacencyList = Record<string, string[]>;

/**
 * Represents a cycle in the dependency graph
 */
export interface DependencyCycle {
  /** Array of card IDs forming the cycle (first ID repeated at end) */
  cycle: string[];
  /** Human-readable description of the cycle */
  description: string;
}

/**
 * Build adjacency list from cards array
 *
 * Maps each card ID to the IDs of cards it depends on.
 */
function buildAdjacencyList(cards: Card[]): AdjacencyList {
  const adjList: AdjacencyList = {};

  for (const card of cards) {
    adjList[card.ID] = card.Dependencies || [];
  }

  return adjList;
}

/**
 * Format a cycle path as a human-readable string
 */
function formatCyclePath(cycle: string[]): string {
  if (cycle.length === 2 && cycle[0] === cycle[1]) {
    return `${cycle[0]} → ${cycle[0]} (self-loop)`;
  }

  return cycle.join(" → ");
}

/**
 * Detect cycles in card dependency graph using DFS
 *
 * Uses depth-first search with a recursion stack to detect back edges.
 * A back edge indicates a cycle in the directed graph.
 *
 * Algorithm: O(V + E) where V = number of cards, E = number of dependencies
 *
 * @param cards Array of cards to analyze
 * @returns Array of detected cycles (empty if no cycles found)
 */
export function detectCycles(cards: Card[]): DependencyCycle[] {
  const adjList = buildAdjacencyList(cards);
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: DependencyCycle[] = [];

  /**
   * DFS helper function
   *
   * @param cardId Current card being visited
   * @param path Current path from root to this card
   */
  function dfs(cardId: string, path: string[]): void {
    visited.add(cardId);
    recStack.add(cardId);
    path.push(cardId);

    const dependencies = adjList[cardId] || [];

    for (const depId of dependencies) {
      if (!visited.has(depId)) {
        // Unvisited node - continue DFS
        dfs(depId, path);
      } else if (recStack.has(depId)) {
        // Back edge found - cycle detected
        const cycleStart = path.indexOf(depId);
        const cyclePath = [...path.slice(cycleStart), depId];

        cycles.push({
          cycle: cyclePath,
          description: formatCyclePath(cyclePath),
        });
      }
      // If visited but not in recStack, it's a cross edge (valid)
    }

    recStack.delete(cardId);
    path.pop();
  }

  // Visit all nodes (handles disconnected components)
  for (const card of cards) {
    if (!visited.has(card.ID)) {
      dfs(card.ID, []);
    }
  }

  return cycles;
}

/**
 * Check if adding a dependency would create a cycle
 *
 * @param cards Current cards array
 * @param fromCardId Card that would depend on toCardId
 * @param toCardId Card that fromCardId would depend on
 * @returns True if adding dependency would create a cycle
 */
export function wouldCreateCycle(
  cards: Card[],
  fromCardId: string,
  toCardId: string
): boolean {
  // Create temporary cards array with the new dependency
  const tempCards = cards.map((card) => {
    if (card.ID === fromCardId) {
      return {
        ...card,
        Dependencies: [...(card.Dependencies || []), toCardId],
      };
    }
    return card;
  });

  const cycles = detectCycles(tempCards);
  return cycles.length > 0;
}

/**
 * Validate all dependencies exist and detect cycles
 *
 * @param cards Array of cards to validate
 * @returns Validation result with any errors found
 */
export interface DependencyValidation {
  valid: boolean;
  cycles: DependencyCycle[];
  missingDependencies: Array<{
    cardId: string;
    missingDepId: string;
  }>;
  errors: string[];
}

export function validateDependencies(cards: Card[]): DependencyValidation {
  const cardIds = new Set(cards.map((c) => c.ID));
  const missingDependencies: Array<{ cardId: string; missingDepId: string }> = [];
  const errors: string[] = [];

  // Check for missing dependencies
  for (const card of cards) {
    if (card.Dependencies) {
      for (const depId of card.Dependencies) {
        if (!cardIds.has(depId)) {
          missingDependencies.push({
            cardId: card.ID,
            missingDepId: depId,
          });
          errors.push(
            `Card ${card.ID} depends on non-existent card ${depId}`
          );
        }
      }
    }
  }

  // Detect cycles
  const cycles = detectCycles(cards);

  if (cycles.length > 0) {
    for (const cycle of cycles) {
      errors.push(`Dependency cycle detected: ${cycle.description}`);
    }
  }

  return {
    valid: errors.length === 0,
    cycles,
    missingDependencies,
    errors,
  };
}

/**
 * Get all cards that depend on a given card (reverse dependencies)
 *
 * @param cards Array of all cards
 * @param cardId Card to find dependents for
 * @returns Array of card IDs that depend on the given card
 */
export function getDependents(cards: Card[], cardId: string): string[] {
  return cards
    .filter((card) => card.Dependencies?.includes(cardId))
    .map((card) => card.ID);
}

/**
 * Get dependency depth (longest path from this card to a card with no dependencies)
 *
 * @param cards Array of all cards
 * @param cardId Card to calculate depth for
 * @returns Depth (0 if no dependencies, -1 if cycle detected)
 */
export function getDependencyDepth(cards: Card[], cardId: string): number {
  const adjList = buildAdjacencyList(cards);
  const visiting = new Set<string>();
  const depths = new Map<string, number>();

  function calculateDepth(id: string): number {
    // Check cache
    if (depths.has(id)) {
      return depths.get(id)!;
    }

    // Detect cycle
    if (visiting.has(id)) {
      return -1;
    }

    visiting.add(id);

    const deps = adjList[id] || [];

    if (deps.length === 0) {
      // No dependencies - depth 0
      depths.set(id, 0);
      visiting.delete(id);
      return 0;
    }

    // Calculate max depth of dependencies
    let maxDepth = 0;
    for (const depId of deps) {
      const depDepth = calculateDepth(depId);
      if (depDepth === -1) {
        // Cycle detected
        visiting.delete(id);
        return -1;
      }
      maxDepth = Math.max(maxDepth, depDepth);
    }

    const depth = maxDepth + 1;
    depths.set(id, depth);
    visiting.delete(id);
    return depth;
  }

  return calculateDepth(cardId);
}

/**
 * Sort cards in topological order (dependencies before dependents)
 *
 * @param cards Array of cards to sort
 * @returns Sorted array (cards with no dependencies first)
 * @throws Error if cycles are detected
 */
export function topologicalSort(cards: Card[]): Card[] {
  const cycles = detectCycles(cards);

  if (cycles.length > 0) {
    throw new Error(
      `Cannot perform topological sort: cycles detected (${cycles[0].description})`
    );
  }

  const adjList = buildAdjacencyList(cards);
  const visited = new Set<string>();
  const result: Card[] = [];
  const cardMap = new Map(cards.map((c) => [c.ID, c]));

  function dfs(cardId: string): void {
    if (visited.has(cardId)) {
      return;
    }

    visited.add(cardId);

    // Visit dependencies first
    const deps = adjList[cardId] || [];
    for (const depId of deps) {
      dfs(depId);
    }

    // Add current card after dependencies
    const card = cardMap.get(cardId);
    if (card) {
      result.push(card);
    }
  }

  // Visit all cards
  for (const card of cards) {
    if (!visited.has(card.ID)) {
      dfs(card.ID);
    }
  }

  return result;
}
