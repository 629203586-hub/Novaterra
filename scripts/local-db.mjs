import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
export function openDatabase(filename=':memory:') {
  const raw=new DatabaseSync(filename);raw.exec('PRAGMA foreign_keys=ON');
  raw.exec('CREATE TABLE IF NOT EXISTS _local_migrations (name TEXT PRIMARY KEY)');
  for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())if(!raw.prepare('SELECT name FROM _local_migrations WHERE name=?').get(name)){
    raw.exec('BEGIN');try{raw.exec(readFileSync(new URL(`../drizzle/${name}`,import.meta.url),'utf8'));raw.prepare('INSERT INTO _local_migrations VALUES (?)').run(name);raw.exec('COMMIT');}catch(e){raw.exec('ROLLBACK');throw e;}
  }
  const prepare=sql=>({args:[],bind(...args){this.args=args;return this;},first(){return raw.prepare(sql).get(...this.args)||null;},all(){return {results:raw.prepare(sql).all(...this.args),success:true};},run(){const r=raw.prepare(sql).run(...this.args);return {results:[],success:true,meta:{changes:r.changes}};}});
  return {raw,prepare,async batch(statements){raw.exec('BEGIN');try{const result=statements.map(s=>{try{return s.all();}catch{return s.run();}});raw.exec('COMMIT');return result;}catch(e){raw.exec('ROLLBACK');throw e;}}};
}
