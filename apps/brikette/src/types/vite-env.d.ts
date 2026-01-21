// Runtime globals shared across environments.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }

  interface ImportMetaGlobOptions {
    as?: string;
    eager?: boolean;
    import?: string;
    /**
     * Enables specifying multiple query parameters such as `?raw&url`.
     */
    [key: string]: string | boolean | undefined;
  }

  interface ImportMeta {
    env?: Record<string, unknown>;
    glob<T = unknown>(pattern: string, options?: ImportMetaGlobOptions): Record<string, () => Promise<T>>;
    globEager?<T = unknown>(pattern: string, options?: ImportMetaGlobOptions): Record<string, T>;
  }
}

export {};
