/**
 * Analytics Module
 *
 * Privacy-preserving analytics utilities:
 * - Unique visitor counting (HyperLogLog)
 * - Trending content detection (Count-Min Sketch with time decay)
 */

export {
  type ContentType,
  getTrendingGuides,
  getTrendingSearches,
  getTrendingService,
  recordGuideView,
  recordSearchQuery,
  type TrendingItem,
  TrendingService,
  type TrendingServiceConfig,
} from "./trending";
export {
  getUniqueVisitorCount,
  getUniqueVisitorCountRange,
  getUniqueVisitorStore,
  InMemoryUniqueVisitorStore,
  trackUniqueVisitor,
  type UniqueVisitorStore,
  UniqueVisitorTracker,
} from "./unique-visitors";
