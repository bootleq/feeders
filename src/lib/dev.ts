import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtempSync, writeFileSync } from 'fs';

export function makeTempSQL(text: string) {
  const dir = mkdtempSync(join(tmpdir(), 'sql-'));
  const file = join(dir, 'query.sql');
  writeFileSync(file, text);
  return file;
}

export function unprepareStatement(querySQL: any) {
  const { sql, params } = querySQL;
  if (!params.length) {
    return sql;
  }

  if (params.length !== sql.match(/\?/g)?.length) {
    throw new Error("Unmatched parameter size for the SQL query.");
  }

  let index = 0;

  return sql.replace(/\?/g, () => {
    const param = params[index++];
    if (param === null) {
      return "NULL";
    }
    if (typeof param === "string") {
      return `'${param.replace(/'/g, "''")}'`;
    }
    if (typeof param === "number" || typeof param === "boolean") {
      return param.toString();
    }
    throw new Error(`Unsupported parameter type: ${typeof param}`);
  });
}
