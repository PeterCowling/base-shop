import { cfFetch, getAccountId } from "../client.js";
import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

interface D1Database {
  uuid: string;
  name: string;
  version: string;
  num_tables?: number;
  file_size?: number;
  created_at?: string;
}

interface D1QueryResult {
  results: Array<Record<string, unknown>>;
  success: boolean;
  meta: {
    served_by?: string;
    duration?: number;
    changes?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

export const d1Tools = [
  {
    name: "d1_list_databases",
    description: "List all D1 databases in the account",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "d1_get_database",
    description: "Get details for a specific D1 database",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "Database UUID or name",
        },
      },
      required: ["databaseId"],
    },
  },
  {
    name: "d1_list_tables",
    description: "List all tables in a D1 database",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "Database UUID or name",
        },
      },
      required: ["databaseId"],
    },
  },
  {
    name: "d1_query",
    description: "Execute a READ-ONLY SQL query on a D1 database. Only SELECT statements are allowed.",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "Database UUID or name",
        },
        sql: {
          type: "string",
          description: "SQL query to execute (SELECT only)",
        },
        params: {
          type: "array",
          description: "Optional query parameters for prepared statements",
          items: { type: "string" },
        },
      },
      required: ["databaseId", "sql"],
    },
  },
  {
    name: "d1_table_info",
    description: "Get schema information for a table (columns, types, indexes)",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "Database UUID or name",
        },
        tableName: {
          type: "string",
          description: "Table name",
        },
      },
      required: ["databaseId", "tableName"],
    },
  },
  {
    name: "d1_stats",
    description: "Get database statistics (size, table count, row counts)",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "Database UUID or name",
        },
      },
      required: ["databaseId"],
    },
  },
] as const;

async function resolveDatabaseId(idOrName: string): Promise<string> {
  // If it looks like a UUID, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName)) {
    return idOrName;
  }

  // Otherwise, look up by name
  const accountId = getAccountId();
  const databases = await cfFetch<D1Database[]>(
    `/accounts/${accountId}/d1/database`
  );

  const db = databases.find((d) => d.name === idOrName);
  if (!db) {
    throw new Error(`Database '${idOrName}' not found`);
  }
  return db.uuid;
}

async function executeQuery(
  databaseId: string,
  sql: string,
  params?: string[]
): Promise<D1QueryResult> {
  const accountId = getAccountId();
  const body: { sql: string; params?: string[] } = { sql };
  if (params && params.length > 0) {
    body.params = params;
  }

  const result = await cfFetch<D1QueryResult[]>(
    `/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return result[0];
}

export async function handleD1Tool(name: string, args: unknown) {
  try {
    const accountId = getAccountId();
    const params = (args || {}) as Record<string, unknown>;

    switch (name) {
      case "d1_list_databases": {
        const databases = await cfFetch<D1Database[]>(
          `/accounts/${accountId}/d1/database`
        );

        return jsonResult({
          databases: databases.map((db) => ({
            id: db.uuid,
            name: db.name,
            version: db.version,
            tables: db.num_tables,
            sizeBytes: db.file_size,
            createdAt: db.created_at,
          })),
          total: databases.length,
        });
      }

      case "d1_get_database": {
        const dbIdOrName = params.databaseId as string;
        if (!dbIdOrName) {
          return errorResult("Database ID or name is required");
        }

        const databaseId = await resolveDatabaseId(dbIdOrName);
        const db = await cfFetch<D1Database>(
          `/accounts/${accountId}/d1/database/${databaseId}`
        );

        return jsonResult({
          id: db.uuid,
          name: db.name,
          version: db.version,
          tables: db.num_tables,
          sizeBytes: db.file_size,
          createdAt: db.created_at,
        });
      }

      case "d1_list_tables": {
        const dbIdOrName = params.databaseId as string;
        if (!dbIdOrName) {
          return errorResult("Database ID or name is required");
        }

        const databaseId = await resolveDatabaseId(dbIdOrName);
        const result = await executeQuery(
          databaseId,
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"
        );

        const tables = result.results.map((r) => r.name as string);

        return jsonResult({
          databaseId,
          tables,
          total: tables.length,
        });
      }

      case "d1_query": {
        const dbIdOrName = params.databaseId as string;
        const sql = params.sql as string;
        const queryParams = params.params as string[] | undefined;

        if (!dbIdOrName) {
          return errorResult("Database ID or name is required");
        }
        if (!sql) {
          return errorResult("SQL query is required");
        }

        // Security: Only allow SELECT statements
        const trimmedSql = sql.trim().toLowerCase();
        if (!trimmedSql.startsWith("select") && !trimmedSql.startsWith("pragma")) {
          return errorResult(
            "Only SELECT and PRAGMA queries are allowed. This tool is read-only for safety."
          );
        }

        // Block dangerous patterns
        const dangerous = [
          /;\s*(insert|update|delete|drop|create|alter|truncate)/i,
          /into\s+\w+\s*\(/i, // INSERT INTO
        ];
        for (const pattern of dangerous) {
          if (pattern.test(sql)) {
            return errorResult(
              "Query contains disallowed statements. Only read operations are permitted."
            );
          }
        }

        const databaseId = await resolveDatabaseId(dbIdOrName);
        const result = await executeQuery(databaseId, sql, queryParams);

        return jsonResult({
          databaseId,
          sql,
          results: result.results,
          rowCount: result.results.length,
          meta: {
            duration: result.meta.duration,
            rowsRead: result.meta.rows_read,
          },
        });
      }

      case "d1_table_info": {
        const dbIdOrName = params.databaseId as string;
        const tableName = params.tableName as string;

        if (!dbIdOrName) {
          return errorResult("Database ID or name is required");
        }
        if (!tableName) {
          return errorResult("Table name is required");
        }

        // Validate table name to prevent injection
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
          return errorResult("Invalid table name format");
        }

        const databaseId = await resolveDatabaseId(dbIdOrName);

        // Get column info
        const columnsResult = await executeQuery(
          databaseId,
          `PRAGMA table_info(${tableName})`
        );

        // Get index info
        const indexesResult = await executeQuery(
          databaseId,
          `PRAGMA index_list(${tableName})`
        );

        // Get row count
        const countResult = await executeQuery(
          databaseId,
          `SELECT COUNT(*) as count FROM ${tableName}`
        );

        const columns = columnsResult.results.map((col) => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull === 1,
          defaultValue: col.dflt_value,
          primaryKey: col.pk === 1,
        }));

        const indexes = indexesResult.results.map((idx) => ({
          name: idx.name,
          unique: idx.unique === 1,
        }));

        return jsonResult({
          databaseId,
          table: tableName,
          columns,
          indexes,
          rowCount: (countResult.results[0]?.count as number) || 0,
        });
      }

      case "d1_stats": {
        const dbIdOrName = params.databaseId as string;
        if (!dbIdOrName) {
          return errorResult("Database ID or name is required");
        }

        const databaseId = await resolveDatabaseId(dbIdOrName);

        // Get database info
        const db = await cfFetch<D1Database>(
          `/accounts/${accountId}/d1/database/${databaseId}`
        );

        // Get table list
        const tablesResult = await executeQuery(
          databaseId,
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"
        );

        const tables = tablesResult.results.map((r) => r.name as string);

        // Get row counts for each table
        const tableCounts: Array<{ table: string; rows: number }> = [];
        for (const table of tables.slice(0, 20)) {
          // Limit to 20 tables
          try {
            const countResult = await executeQuery(
              databaseId,
              `SELECT COUNT(*) as count FROM "${table}"`
            );
            tableCounts.push({
              table,
              rows: (countResult.results[0]?.count as number) || 0,
            });
          } catch {
            tableCounts.push({ table, rows: -1 }); // Error getting count
          }
        }

        const totalRows = tableCounts
          .filter((t) => t.rows >= 0)
          .reduce((a, b) => a + b.rows, 0);

        return jsonResult({
          database: {
            id: db.uuid,
            name: db.name,
            version: db.version,
            sizeBytes: db.file_size,
            sizeMB: db.file_size
              ? Math.round((db.file_size / 1024 / 1024) * 100) / 100
              : null,
          },
          tables: {
            count: tables.length,
            details: tableCounts,
          },
          totalRows,
        });
      }

      default:
        return errorResult(`Unknown D1 tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
