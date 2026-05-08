import { validate } from './src/index';
const sql = 'SELECT "MY_FUNC"()';
const policy = {
  allowedTables: ['public.users'],
  allowedFunctions: ['my_func']
};
const result = validate(sql, policy);
console.log(result);
