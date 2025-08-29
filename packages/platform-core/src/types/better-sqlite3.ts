// Minimal in-memory stub for `better-sqlite3` used in tests.
// It implements only the subset of the API exercised by our
// inventory repository (prepare, exec, transaction, etc.).

type Row = Record<string, unknown>;

class Statement {
  constructor(private db: Database, private type: string) {}

  run(...args: unknown[]) {
    switch (this.type) {
      case "replace": {
        const [
          sku,
          productId,
          variantAttributes,
          quantity,
          lowStockThreshold,
          wearCount,
          wearAndTearLimit,
          maintenanceCycle,
        ] = args;
        const row: Row = {
          sku,
          productId,
          variantAttributes,
          quantity,
          lowStockThreshold: lowStockThreshold ?? null,
          wearCount: wearCount ?? null,
          wearAndTearLimit: wearAndTearLimit ?? null,
          maintenanceCycle: maintenanceCycle ?? null,
        };
        this.db.rows.set(`${sku}|${variantAttributes}`, row);
        return { changes: 1 };
      }
      case "deleteAll":
        this.db.rows.clear();
        return { changes: 0 };
      case "deleteOne": {
        const [sku, variant] = args;
        this.db.rows.delete(`${sku}|${variant}`);
        return { changes: 1 };
      }
      default:
        return { changes: 0 };
    }
  }

  all() {
    // Return a minimal row set, mirroring what the tests expect to see
    return Array.from(this.db.rows.values()).map((r) => ({
      sku: r.sku,
      variantAttributes: r.variantAttributes,
      quantity: r.quantity,
    }));
  }

  get(...args: unknown[]) {
    const [sku, variant] = args;
    return this.db.rows.get(`${sku}|${variant}`);
  }
}

class Database {
  static stores = new Map<string, Map<string, Row>>();
  rows: Map<string, Row>;

  constructor(file: string) {
    if (!Database.stores.has(file)) {
      Database.stores.set(file, new Map());
    }
    this.rows = Database.stores.get(file)!;
  }

  exec(_sql: string) {
    return this;
  }

  prepare(sql: string) {
    const normalized = sql.trim().toLowerCase();
    if (normalized.startsWith("select") && normalized.includes("where")) {
      return new Statement(this, "selectOne");
    }
    if (normalized.startsWith("select")) {
      return new Statement(this, "selectAll");
    }
    if (normalized.startsWith("replace into")) {
      return new Statement(this, "replace");
    }
    if (normalized.startsWith("delete from") && normalized.includes("where")) {
      return new Statement(this, "deleteOne");
    }
    if (normalized.startsWith("delete from")) {
      return new Statement(this, "deleteAll");
    }
    throw new Error(`Unsupported SQL: ${sql}`);
  }

  transaction<T extends (...args: unknown[]) => unknown>(fn: T) {
    const wrapped = (
      ...args: Parameters<T>
    ): ReturnType<T> => fn(...args) as ReturnType<T>;
    (wrapped as typeof wrapped & { immediate: typeof wrapped }).immediate = wrapped;
    return wrapped as typeof wrapped & { immediate: typeof wrapped };
  }
}

export default Database;
