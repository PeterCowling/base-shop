/**
 * GA4-06: Site search event tracking tests
 *
 * Verifies that useGuideSearch fires GA4 `search` events
 * with search_term and results_count parameters.
 */
import { act, renderHook } from "@testing-library/react";

// --- Mocks (must be before import under test) ---

const mockSearch = jest.fn().mockReturnValue([]);
const mockSuggest = jest.fn().mockReturnValue([]);
const mockBuildIndex = jest.fn();
const mockHasIndex = jest.fn().mockReturnValue(true);

jest.mock("@/lib/search/guide-search", () => ({
  getGuideSearchService: () => ({
    search: mockSearch,
    suggest: mockSuggest,
    buildIndex: mockBuildIndex,
    hasIndex: mockHasIndex,
  }),
}));

jest.mock("@/data/guides.index", () => ({
  GUIDES_INDEX: [],
}));

jest.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

// eslint-disable-next-line import/first -- mocks must be declared before the import under test
import { useGuideSearch } from "@/hooks/useGuideSearch";

describe("useGuideSearch GA4 search event (GA4-06)", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
    mockSearch.mockReturnValue([]);
    mockHasIndex.mockReturnValue(true);
  });

  afterEach(() => {
    window.gtag = originalGtag;
    jest.useRealTimers();
  });

  // TC-01: Search with results → gtag("event", "search", { search_term, results_count }) fired
  it("fires GA4 search event with search_term and results_count when search has results", () => {
    mockSearch.mockReturnValue([
      { key: "guide-a", score: 1.5 },
      { key: "guide-b", score: 1.0 },
    ]);

    const { result } = renderHook(() => useGuideSearch({ debounceMs: 100 }));

    act(() => {
      result.current.setQuery("positano");
    });

    // Advance past debounce
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(window.gtag).toHaveBeenCalledWith("event", "search", {
      search_term: "positano",
      results_count: 2,
    });
  });

  // TC-02: Search with no results → event fires with results_count: 0
  it("fires GA4 search event with results_count 0 when no results found", () => {
    mockSearch.mockReturnValue([]);

    const { result } = renderHook(() => useGuideSearch({ debounceMs: 100 }));

    act(() => {
      result.current.setQuery("xyznonexistent");
    });

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(window.gtag).toHaveBeenCalledWith("event", "search", {
      search_term: "xyznonexistent",
      results_count: 0,
    });
  });

  // TC-03: Empty query → no event fired
  it("does not fire GA4 search event for empty query", () => {
    const { result } = renderHook(() => useGuideSearch({ debounceMs: 100 }));

    act(() => {
      result.current.setQuery("   ");
    });

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(window.gtag).not.toHaveBeenCalled();
  });

  // TC-04: Debounced → only one event per debounce cycle
  it("fires only one GA4 search event per debounce cycle, not per keystroke", () => {
    mockSearch.mockReturnValue([{ key: "guide-a", score: 1.0 }]);

    const { result } = renderHook(() => useGuideSearch({ debounceMs: 200 }));

    // Simulate rapid keystrokes
    act(() => {
      result.current.setQuery("p");
    });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    act(() => {
      result.current.setQuery("po");
    });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    act(() => {
      result.current.setQuery("pos");
    });

    // Advance past debounce from last keystroke
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Should have fired exactly once, with the final query
    const gtagCalls = (window.gtag as jest.Mock).mock.calls.filter(
      (call) => call[0] === "event" && call[1] === "search",
    );
    expect(gtagCalls).toHaveLength(1);
    expect(gtagCalls[0][2]).toEqual({
      search_term: "pos",
      results_count: 1,
    });
  });
});
