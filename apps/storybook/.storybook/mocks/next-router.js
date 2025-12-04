// Minimal Next.js router stub for Storybook Next mock compatibility
const routerState = {
  route: "/",
  asPath: "/",
  basePath: "/",
  pathname: "/",
  query: {},
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
};

const routerAPI = {
  ...routerState,
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  reload: () => {},
  back: () => {},
  forward: () => {},
  prefetch: () => Promise.resolve(),
  beforePopState: () => {},
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
};

const singletonRouter = {
  router: routerAPI,
  readyCallbacks: [],
  ready(cb) {
    if (typeof cb === "function") {
      this.readyCallbacks.push(cb);
      cb();
    }
  },
};

export const useRouter = () => routerAPI;
export const withRouter = (Comp) => Comp;
export const Router = routerAPI;
export default singletonRouter;
