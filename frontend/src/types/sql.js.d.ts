declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export interface ParamsObject {
    [key: string]: unknown;
  }

  export interface ParamsCallback {
    (obj: ParamsObject): void;
  }

  export interface StatementIteratorResult {
    done: boolean;
    value: Statement;
  }

  export class Statement {
    bind(params?: unknown[] | ParamsObject): boolean;
    step(): boolean;
    getColumnNames(): string[];
    get(params?: unknown[] | ParamsObject): unknown[];
    getAsObject(params?: unknown[] | ParamsObject): ParamsObject;
    run(params?: unknown[] | ParamsObject): void;
    reset(): void;
    free(): boolean;
  }

  export class Database {
    constructor(data?: ArrayLike<number>);
    run(sql: string, params?: unknown[] | ParamsObject): Database;
    exec(sql: string, params?: unknown[] | ParamsObject): QueryExecResult[];
    each(
      sql: string,
      params: unknown[] | ParamsObject,
      callback: ParamsCallback,
      done?: () => void
    ): Database;
    each(sql: string, callback: ParamsCallback, done?: () => void): Database;
    prepare(sql: string, params?: unknown[] | ParamsObject): Statement;
    iterateStatements(sql: string): { next: () => StatementIteratorResult };
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }

  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
    wasmBinary?: ArrayBuffer;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
