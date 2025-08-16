/**
 * Builds a mapping of component source files to their exported name
 * by walking through barrel files in the components directory.
 */
export declare function getComponentNameMap(componentsDir: string): Record<string, string>;
