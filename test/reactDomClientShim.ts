import * as ReactDOM from 'react-dom';

// Provide a compatible `createRoot` API for React 19.
export function createRoot(container: Element) {
  return {
    render: (children: React.ReactNode) => ReactDOM.render(children, container),
    unmount: () => ReactDOM.unmountComponentAtNode(container),
  };
}

// Re-export hydrate for existing tests
export function hydrateRoot(...args: Parameters<typeof ReactDOM.hydrate>) {
  // @ts-ignore – hydrate may be deprecated in React 19 but is still used by tests
  return (ReactDOM.hydrate as any)(...args);
}

export * from 'react-dom';
export default ReactDOM;
