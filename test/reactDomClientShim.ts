import * as ReactDOMClient from "react-dom/client";
import * as ReactDOM from "react-dom";

type ReactDOMClientLike = typeof ReactDOMClient & {
  createRoot?: (container: Element) => {
    render(children: React.ReactNode): void;
    unmount(): void;
  };
  hydrateRoot?: (
    container: Element | Document | DocumentFragment,
    children: React.ReactNode,
  ) => unknown;
};

type ReactDOMLegacyLike = typeof ReactDOM & {
  render?: (children: React.ReactNode, container: Element) => unknown;
  unmountComponentAtNode?: (container: Element) => unknown;
  hydrate?: (
    children: React.ReactNode,
    container: Element | Document | DocumentFragment,
  ) => unknown;
};

const client = ReactDOMClient as ReactDOMClientLike;
const legacyDom = ReactDOM as ReactDOMLegacyLike;

// Provide a compatible `createRoot` API for both React 18 and 19.
export function createRoot(container: Element) {
  if (typeof client.createRoot === "function") {
    return client.createRoot(container);
  }

  // Fallback for React versions that only expose `render`/`unmountComponentAtNode`.
  return {
    render: (children: React.ReactNode) =>
      legacyDom.render?.(children, container),
    unmount: () => legacyDom.unmountComponentAtNode?.(container),
  };
}

// Re-export hydrateRoot for existing tests, supporting both React 18 and 19.
export function hydrateRoot(container: Element | Document | DocumentFragment, children: React.ReactNode) {
  if (typeof client.hydrateRoot === "function") {
    return client.hydrateRoot(container, children);
  }

  // @ts-expect-error -- fallback for React versions that only expose legacy ReactDOM.hydrate
  return legacyDom.hydrate(children, container);
}

export * from "react-dom";
export default ReactDOM;
