export interface ParsedStatement {
  type: 'select' | 'insert' | 'update' | 'delete' | 'unknown';
  tables: TableReference[];
  functions: FunctionCall[];
  raw: unknown;
}

export interface TableReference {
  schema?: string;
  name: string;
  alias?: string;
  location?: { line: number; column: number };
}

export interface FunctionCall {
  name: string;
  schema?: string;
  location?: { line: number; column: number };
}

export interface ParseResult {
  success: boolean;
  statements: ParsedStatement[];
  error?: {
    message: string;
    location?: { line: number; column: number };
  };
}
