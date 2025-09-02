import * as ReactDOMClient from 'react-dom/client.js';
import * as ReactDOM from 'react-dom';

// Provide a compatible `createRoot` API for both React 18 and 19.
export function createRoot(container: Element) {
  if (typeof (ReactDOMClient as any).createRoot === 'function') {
    return (ReactDOMClient as any).createRoot(container);
  }

  // Fallback for React versions that only expose `render`/`unmountComponentAtNode`.
  return {
    render: (children: React.ReactNode) =>
      (ReactDOM as any).render(children, container),
    unmount: () => (ReactDOM as any).unmountComponentAtNode(container),
  };
}

// Re-export hydrateRoot for existing tests, supporting both React 18 and 19.
export function hydrateRoot(container: Element | Document | DocumentFragment, children: React.ReactNode) {
  if (typeof (ReactDOMClient as any).hydrateRoot === "function") {
    return (ReactDOMClient as any).hydrateRoot(container, children);
  }

  // @ts-ignore – fallback for React versions that only expose `hydrate`
  return (ReactDOM as any).hydrate(children, container);
}

export * from 'react-dom';
export default ReactDOM;
