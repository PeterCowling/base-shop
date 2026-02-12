// Ensure JSX namespace is globally available for test typecheck.
// Resolves TS2503 "Cannot find namespace 'JSX'" in source files
// type-checked transitively through test imports.
//
// With "react" in tsconfig types, React's JSX namespace is available
// but needs to be re-exported globally for files that reference
// bare `JSX.Element` without importing from React.

import type { JSX as ReactJSX } from "react";

/* eslint-disable @typescript-eslint/no-empty-object-type */
declare global {
  namespace JSX {
    interface Element extends ReactJSX.Element {}
    interface ElementClass extends ReactJSX.ElementClass {}
    interface ElementAttributesProperty extends ReactJSX.ElementAttributesProperty {}
    interface ElementChildrenAttribute extends ReactJSX.ElementChildrenAttribute {}
    interface IntrinsicAttributes extends ReactJSX.IntrinsicAttributes {}
    interface IntrinsicClassAttributes<T> extends ReactJSX.IntrinsicClassAttributes<T> {}
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

export {};
