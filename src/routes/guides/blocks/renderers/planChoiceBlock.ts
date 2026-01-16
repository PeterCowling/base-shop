import type { BlockAccumulator } from "../blockAccumulator";

export function applyPlanChoiceBlock(acc: BlockAccumulator): void {
  acc.mergeTemplate({ showPlanChoice: true });
}
