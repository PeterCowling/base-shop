// Minimal in-memory stub for `better-sqlite3` used in tests.
// Implements only the subset of the API exercised by the inventory repository.

class Statement {
  constructor(db, type) {
    this.db = db;
    this.type = type;
  }

  run(...args) {
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
        const row = {
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
    return Array.from(this.db.rows.values()).map((r) => ({
      sku: r.sku,
      variantAttributes: r.variantAttributes,
      quantity: r.quantity,
    }));
  }

  get(...args) {
    const [sku, variant] = args;
    return this.db.rows.get(`${sku}|${variant}`);
  }
}

class Database {
  static stores = new Map();

  constructor(file) {
    if (!Database.stores.has(file)) {
      Database.stores.set(file, new Map());
    }
    this.rows = Database.stores.get(file);
  }

  exec() {
    return this;
  }

  prepare(sql) {
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

  transaction(fn) {
    const wrapped = (...args) => fn(...args);
    wrapped.immediate = wrapped;
    return wrapped;
  }
}

module.exports = Database;
