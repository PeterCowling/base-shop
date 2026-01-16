import type { BlockAccumulator } from "../blockAccumulator";

export function applyTransportNoticeBlock(acc: BlockAccumulator): void {
  acc.mergeTemplate({ showTransportNotice: true });
}
