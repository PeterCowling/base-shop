// Re-export utility functions so imports can target "./utils/linkTokens"
// while the implementation remains in the underscored module.
export {
  renderBodyBlocks,
  renderGuideLinkTokens,
  sanitizeLinkLabel,
  stripGuideLinkTokens,
  stripGuideMarkup,
} from "./_linkTokens";
