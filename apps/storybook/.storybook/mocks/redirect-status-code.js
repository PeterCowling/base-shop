// Minimal ESM-friendly stub for Next.js redirect status codes used by Storybook mocks
export const RedirectStatusCode = {
  SeeOther: 303,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
};

// Backward compat alias used by older mocks
export const RedirectType = RedirectStatusCode;

export default RedirectStatusCode;
