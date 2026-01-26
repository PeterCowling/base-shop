// Re-export utility functions so imports can target "./utils/linkTokens"
// while the implementation remains in the underscored module.
export { renderBodyBlocks, renderGuideLinkTokens, stripGuideLinkTokens, stripGuideMarkup } from "./_linkTokens";
