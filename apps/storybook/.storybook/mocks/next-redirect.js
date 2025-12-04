// Minimal stub for Next.js client redirect helpers used by Storybook mocks
export const RedirectType = {
  push: "push",
  replace: "replace",
};

export const getRedirectError = (url, type = RedirectType.push, status = 303) => ({
  url,
  type,
  status,
  isRedirectError: true,
});

export const redirect = (url) => {
  throw getRedirectError(url, RedirectType.push, 303);
};

export const permanentRedirect = (url) => {
  throw getRedirectError(url, RedirectType.replace, 308);
};

// Placeholder component used by Next for boundary handling; inert here
export const RedirectBoundary = ({ children }) => children ?? null;

const redirectApi = {
  RedirectType,
  getRedirectError,
  redirect,
  permanentRedirect,
  RedirectBoundary,
};

export default redirectApi;
