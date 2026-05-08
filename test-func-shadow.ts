import { validate } from './src/index';
const sql = 'SELECT "SECRET_FUNC"(), secret_func()';
const policy = {
  allowedTables: ['public.users'],
  allowedFunctions: ['secret_func']
};
const result = validate(sql, policy);
console.log(result);
