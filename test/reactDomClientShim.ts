import * as ReactDOM from 'react-dom';
import path from 'path';
import { createRequire } from 'module';

// Import the original client entry to access createRoot/hydrateRoot when needed.
const nodeRequire =
  typeof require === 'function' ? require : createRequire(__filename);
let ReactDOMClient: any = {};
try {
  const reactDomPkg = nodeRequire.resolve('react-dom/package.json');
  ReactDOMClient = nodeRequire(path.join(reactDomPkg, '../client.js'));
} catch {}

// Provide a compatible `createRoot` API for React 19.
export function createRoot(container: Element) {
  const createRootImpl = (ReactDOM as any).createRoot || (ReactDOMClient as any).createRoot;
  if (typeof createRootImpl === 'function') {
    return createRootImpl(container);
  }
  return {
    render: (_children: React.ReactNode) => {},
    unmount: () => {},
  };
}

// Re-export hydrate for existing tests
export function hydrateRoot(
  container: Element,
  children: React.ReactNode,
  options?: any,
) {
  const hydrate = (ReactDOM as any).hydrateRoot || (ReactDOM as any).hydrate;
  if (typeof hydrate !== 'function') {
    const hydrateClient = (ReactDOMClient as any).hydrateRoot;
    if (typeof hydrateClient === 'function') {
      return hydrateClient(container, children, options);
    }
  }
  if (typeof hydrate === 'function') {
    return hydrate(container, children, options);
  }
  const root = createRoot(container);
  root.render(children);
  return root;
}

export * from 'react-dom';
