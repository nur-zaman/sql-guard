import { Parser } from 'node-sql-parser';
const parser = new Parser();
const sql = 'SELECT * FROM "SECRET_TABLE"';
const ast = parser.astify(sql, { database: 'postgresql' });
console.log(JSON.stringify(ast, null, 2));
