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

// Re-export hydrate for existing tests
export function hydrateRoot(...args: Parameters<typeof ReactDOM.hydrate>) {
  // @ts-ignore – hydrate may be deprecated in React 19 but is still used by tests
  return (ReactDOM.hydrate as any)(...args);
}

export * from 'react-dom';
export default ReactDOM;
