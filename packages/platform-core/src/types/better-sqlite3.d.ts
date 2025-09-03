declare class Database {
  constructor(file: string);
  static stores: Map<string, Map<string, Record<string, unknown>>>;
  rows: Map<string, Record<string, unknown>>;
  exec(sql: string): this;
  prepare(sql: string): {
    run: (...args: unknown[]) => { changes: number };
    all: () => Array<{ sku: unknown; variantAttributes: unknown; quantity: unknown }>;
    get: (...args: unknown[]) => unknown;
  };
  transaction<T extends (...args: any[]) => any>(fn: T): T & { immediate: T };
}
export default Database;
