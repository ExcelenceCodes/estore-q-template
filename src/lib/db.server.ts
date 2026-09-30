import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

class LocalQueryBuilder {
  private table: string;
  private sql: ReturnType<typeof postgres>;
  private columns: string | null = null;
  private count: "exact" | "planned" | "estimated" | null = null;
  private where: { column: string; operator: string; value: Json }[] = [];
  private _or: string | null = null;
  private _order: { column: string; ascending: boolean } | null = null;
  private _limit: number | null = null;
  private offset: number | null = null;
  private insertData: Record<string, Json> | null = null;
  private updateData: Record<string, Json> | null = null;
  private isDelete = false;
  private returning = false;
  private upsertData: Record<string, Json> | null = null;

  constructor(sql: ReturnType<typeof postgres>, table: string) {
    this.sql = sql;
    this.table = table;
  }

  select(columns: string | string[], options?: { count?: "exact" | "planned" | "estimated" }) {
    this.columns = Array.isArray(columns) ? columns.join(", ") : columns;
    this.count = options?.count || null;
    this.returning = this.insertData !== null || this.updateData !== null || this.isDelete;
    return this;
  }

  eq(column: string, value: Json) {
    this.where.push({ column, operator: "=", value });
    return this;
  }

  neq(column: string, value: Json) {
    this.where.push({ column, operator: "!=", value });
    return this;
  }

  or(condition: string) {
    this._or = condition;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this._order = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this._limit = count;
    return this;
  }

  range(start: number, end: number) {
    this.offset = start;
    this._limit = end - start + 1;
    return this;
  }

  insert(values: Record<string, Json>) {
    this.insertData = values;
    return this;
  }

  update(values: Record<string, Json>) {
    this.updateData = values;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  upsert(values: Record<string, Json>) {
    this.upsertData = values;
    this.returning = true;
    return this;
  }

  async maybeSingle(): Promise<{ data: Record<string, Json> | null; error: any; count?: number }> {
    this._limit = 1;
    const result = await this.execute();
    return {
      data: result.data.length > 0 ? result.data[0] : null,
      error: null,
      count: result.count,
    };
  }

  async single(): Promise<{ data: Record<string, Json> | null; error: any; count?: number }> {
    const result = await this.execute();
    if (result.data.length === 0) {
      return { data: null, error: { message: "No rows returned" }, count: result.count };
    }
    if (result.data.length > 1) {
      return { data: null, error: { message: "More than one row returned" }, count: result.count };
    }
    return { data: result.data[0], error: null, count: result.count };
  }

  then(
    onFulfilled?: (value: { data: any[]; error: any; count?: number }) => any,
    onRejected?: (reason: any) => any,
  ) {
    return this.execute().then(onFulfilled, onRejected);
  }

  private async execute(): Promise<{ data: any[]; error: any; count?: number }> {
    let query = "";
    const params: Json[] = [];

    if (this.isDelete) {
      query = `DELETE FROM "${this.table}"`;
    } else if (this.updateData) {
      query = `UPDATE "${this.table}" SET `;
      const setClauses: string[] = [];
      for (const [key, value] of Object.entries(this.updateData)) {
        setClauses.push(`"${key}" = $${params.length + 1}`);
        params.push(value);
      }
      query += setClauses.join(", ");
    } else if (this.upsertData) {
      const keys = Object.keys(this.upsertData);
      const values = Object.values(this.upsertData);
      const returnColumns = this.columns || "*";
      const conflictCol = keys.includes("id") ? "id" : keys[0];
      const setClauses = keys
        .filter((k) => k !== conflictCol)
        .map((k) => `"${k}" = EXCLUDED."${k}"`);
      const conflictClause =
        setClauses.length > 0
          ? `ON CONFLICT ("${conflictCol}") DO UPDATE SET ${setClauses.join(", ")}`
          : `ON CONFLICT ("${conflictCol}") DO NOTHING`;
      query = `INSERT INTO "${this.table}" (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${keys.map((_, i) => `$${params.length + i + 1}`).join(", ")}) ${conflictClause} RETURNING ${returnColumns}`;
      params.push(...values);
      const upsertResult = await this.sql.unsafe(query, params);
      return { data: upsertResult, error: null, count: upsertResult.length };
    } else if (this.insertData) {
      const keys = Object.keys(this.insertData);
      const values = Object.values(this.insertData);

      if (this.returning) {
        const returnColumns = this.columns || "*";
        query = `INSERT INTO "${this.table}" (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${keys.map((_, i) => `$${params.length + i + 1}`).join(", ")}) RETURNING ${returnColumns}`;
        params.push(...values);
        const result = await this.sql.unsafe(query, params);
        return { data: result, error: null, count: result.length };
      }

      query = `INSERT INTO "${this.table}" (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${keys.map((_, i) => `$${params.length + i + 1}`).join(", ")})`;
      params.push(...values);
      await this.sql.unsafe(query, params);
      return { data: null, error: null };
    } else if (this.columns) {
      query = `SELECT ${this.columns}`;
      if (this.count) {
        query += ", count(*) OVER() AS _count";
      }
      query += ` FROM "${this.table}"`;
    } else {
      return { data: [], error: { message: "No columns selected" } };
    }

    if (this.where.length > 0 || this._or) {
      query += " WHERE ";
      const clauses: string[] = [];

      for (const cond of this.where) {
        clauses.push(`"${cond.column}" ${cond.operator} $${params.length + 1}`);
        params.push(cond.value);
      }

      if (this._or) {
        const parts = this._or.split(",");
        const orClauses: string[] = [];
        for (const part of parts) {
          const [col, op, ...valParts] = part.split(".");
          const val = valParts.join(".");
          if (op === "ilike") {
            orClauses.push(`"${col}" ILIKE $${params.length + 1}`);
            params.push(val);
          } else {
            orClauses.push(`"${col}" ${op} $${params.length + 1}`);
            params.push(val);
          }
        }
        clauses.push(`(${orClauses.join(" OR ")})`);
      }

      query += clauses.join(" AND ");
    }

    if (this._order) {
      query += ` ORDER BY "${this._order.column}" ${this._order.ascending ? "ASC" : "DESC"}`;
    }

    if (this.offset !== null && this._limit !== null) {
      query += ` LIMIT ${this._limit} OFFSET ${this.offset}`;
    } else if (this._limit !== null) {
      query += ` LIMIT ${this._limit}`;
    }

    try {
      const result = await this.sql.unsafe(query, params);

      if (this.count && result.length > 0) {
        const count = (result[0] as any)?._count ?? result.length;
        return {
          data: result.map((row: any) => {
            const { _count, ...rest } = row;
            return rest;
          }),
          error: null,
          count,
        };
      }

      if (this.count && result.length === 0) {
        return { data: [], error: null, count: 0 };
      }

      return { data: result, error: null };
    } catch (error: any) {
      return { data: [], error: { message: error.message || "Query failed" } };
    }
  }
}

let cachedLocalSql: ReturnType<typeof postgres> | null = null;

function getLocalSql() {
  const connectionString = process.env["LOCAL_DB_URL"];
  if (!connectionString) {
    throw new Error("LOCAL_DB_URL is required for local database");
  }
  if (!cachedLocalSql) {
    cachedLocalSql = postgres(connectionString, {
      prepare: false,
      query_timeout: 30000,
    });
  }
  return cachedLocalSql;
}

function createLocalClient() {
  const sql = getLocalSql();
  return {
    from(table: string) {
      return new LocalQueryBuilder(sql, table);
    },
    async transaction(fn: (tx: { from(table: string): LocalQueryBuilder }) => Promise<void>) {
      return sql.begin(async (txSql) => {
        const txClient = {
          from(table: string) {
            return new LocalQueryBuilder(txSql as ReturnType<typeof postgres>, table);
          },
        };
        await fn(txClient);
      });
    },
  };
}

export function db(): SupabaseClient | ReturnType<typeof createLocalClient> {
  const provider = (process.env["DB_PROVIDER"] || "lovable").toLowerCase();

  if (provider === "local") {
    return createLocalClient() as SupabaseClient;
  }

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
    throw new Error(
      `Database is not configured for DB_PROVIDER="${provider}". Set the matching URL and service key in .env.`,
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export function dbProvider(): string {
  return (process.env["DB_PROVIDER"] || "lovable").toLowerCase();
}
