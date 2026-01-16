// React 19 compatibility - JSX namespace
import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    type Element = ReactJSX.Element
    type ElementClass = ReactJSX.ElementClass
    type ElementAttributesProperty = ReactJSX.ElementAttributesProperty
    type ElementChildrenAttribute = ReactJSX.ElementChildrenAttribute
    type IntrinsicAttributes = ReactJSX.IntrinsicAttributes
    type IntrinsicClassAttributes<T> = ReactJSX.IntrinsicClassAttributes<T>
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {
      mesh?: Record<string, unknown>;
      sphereGeometry?: Record<string, unknown>;
      meshBasicMaterial?: Record<string, unknown>;
      group?: Record<string, unknown>;
      pointLight?: Record<string, unknown>;
      icosahedronGeometry?: Record<string, unknown>;
      meshStandardMaterial?: Record<string, unknown>;
      ringGeometry?: Record<string, unknown>;
      color?: Record<string, unknown>;
      fog?: Record<string, unknown>;
      ambientLight?: Record<string, unknown>;
      directionalLight?: Record<string, unknown>;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      mesh?: Record<string, unknown>;
      sphereGeometry?: Record<string, unknown>;
      meshBasicMaterial?: Record<string, unknown>;
      group?: Record<string, unknown>;
      pointLight?: Record<string, unknown>;
      icosahedronGeometry?: Record<string, unknown>;
      meshStandardMaterial?: Record<string, unknown>;
      ringGeometry?: Record<string, unknown>;
      color?: Record<string, unknown>;
      fog?: Record<string, unknown>;
      ambientLight?: Record<string, unknown>;
      directionalLight?: Record<string, unknown>;
    }
  }
}

export {};
