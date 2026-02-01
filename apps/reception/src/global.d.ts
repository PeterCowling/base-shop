/**
 * Re-export the JSX namespace from React for backwards compatibility.
 *
 * In React 19, the global JSX namespace was removed from @types/react.
 * Code using `JSX.Element` as a return type needs either:
 * 1. Update to `React.JSX.Element` or `ReactElement`
 * 2. Use this global declaration to restore the namespace
 *
 * This file restores the global JSX namespace to avoid updating 21+ files.
 */
import type { JSX as ReactJSX } from "react";

declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
    type ElementClass = ReactJSX.ElementClass;
    type ElementAttributesProperty = ReactJSX.ElementAttributesProperty;
    type ElementChildrenAttribute = ReactJSX.ElementChildrenAttribute;
    type LibraryManagedAttributes<C, P> = ReactJSX.LibraryManagedAttributes<C, P>;
    type IntrinsicAttributes = ReactJSX.IntrinsicAttributes;
    type IntrinsicClassAttributes<T> = ReactJSX.IntrinsicClassAttributes<T>;
    type IntrinsicElements = ReactJSX.IntrinsicElements;
  }
}
