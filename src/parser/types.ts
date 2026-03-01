/**
 * Types for parsed SQL statements, tables, and function calls.
 * These types represent the AST (Abstract Syntax Tree) produced by the SQL parser.
 *
 * @module
 */

/**
 * A parsed SQL statement with extracted metadata.
 * Contains the statement type, referenced tables, and function calls.
 */
export interface ParsedStatement {
  /** The type of SQL statement (select, insert, update, delete, or unknown) */
  type: 'select' | 'insert' | 'update' | 'delete' | 'unknown';
  /** Tables referenced in this statement */
  tables: TableReference[];
  /** Function calls in this statement */
  functions: FunctionCall[];
  /** Raw AST from the parser (internal use) */
  raw: unknown;
}

/**
 * Reference to a table in a SQL query.
 * May be schema-qualified or unqualified.
 */
export interface TableReference {
  /** Schema name (e.g., 'public'). Undefined for unqualified tables. */
  schema?: string;
  /** Table name */
  name: string;
  /** Table alias, if specified (e.g., 'u' in `FROM users u`) */
  alias?: string;
  /** Source location in the SQL string */
  location?: { line: number; column: number };
}

/**
 * Reference to a function call in a SQL query.
 */
export interface FunctionCall {
  /** Function name */
  name: string;
  /** Schema name (e.g., 'pg_catalog'). Undefined for unqualified functions. */
  schema?: string;
  /** Source location in the SQL string */
  location?: { line: number; column: number };
}

/**
 * Result of parsing a SQL string.
 * On success, contains the parsed statements.
 * On failure, contains error information.
 */
export interface ParseResult {
  /** Whether parsing succeeded */
  success: boolean;
  /** Parsed statements (empty if success is false) */
  statements: ParsedStatement[];
  /** Error information (only present if success is false) */
  error?: {
    /** Error message from the parser */
    message: string;
    /** Location where the error occurred, if available */
    location?: { line: number; column: number };
  };
}
