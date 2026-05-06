import { Parser } from 'node-sql-parser';
const parser = new Parser();
const sql = 'SELECT lower(), "LOWER"(), secret_function(), "SECRET_FUNCTION"()';
const ast = parser.astify(sql, { database: 'postgresql' });
console.log(JSON.stringify(ast, null, 2));
