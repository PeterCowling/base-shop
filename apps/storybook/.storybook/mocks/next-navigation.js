// Lightweight browser-safe stub for Next.js navigation internals used by Storybook mocks
export const RedirectType = {
  push: "push",
  replace: "replace",
};

const noop = () => {};

export const useSearchParams = () => new URLSearchParams();
export const usePathname = () => "/";
export const useSelectedLayoutSegment = () => null;
export const useSelectedLayoutSegments = () => [];
export const useRouter = () => ({
  push: noop,
  replace: noop,
  forward: noop,
  back: noop,
  prefetch: noop,
  refresh: noop,
});
export const useServerInsertedHTML = () => {};
export const notFound = () => {
  throw new Error("notFound()");
};
export const useParams = () => ({});

// Default export mirrors Next's module shape for compatibility
const navigationApi = {
  RedirectType,
  useSearchParams,
  usePathname,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
  useRouter,
  useServerInsertedHTML,
  notFound,
  useParams,
};

export default navigationApi;
