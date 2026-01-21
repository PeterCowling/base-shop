/**
 * Analytics Module
 *
 * Privacy-preserving analytics utilities:
 * - Unique visitor counting (HyperLogLog)
 * - Trending content detection (Count-Min Sketch with time decay)
 */

export {
  UniqueVisitorTracker,
  type UniqueVisitorStore,
  InMemoryUniqueVisitorStore,
  getUniqueVisitorStore,
  trackUniqueVisitor,
  getUniqueVisitorCount,
  getUniqueVisitorCountRange,
} from "./unique-visitors";

export {
  TrendingService,
  type TrendingServiceConfig,
  type ContentType,
  type TrendingItem,
  getTrendingService,
  recordGuideView,
  getTrendingGuides,
  recordSearchQuery,
  getTrendingSearches,
} from "./trending";
