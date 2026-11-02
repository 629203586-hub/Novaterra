import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const html=await readFile(resolve(root,'dist/italy.html'),'utf8');
const map=JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/s)[1]).imports;
test('Italy has a complete local module graph and every exported script parses',async()=>{
 for(const [name,url] of Object.entries(map)){
  assert.ok(url.startsWith('./assets/italy-worlds/'),name);const path=resolve(root,'dist',url);assert.ok((await stat(path)).isFile());const code=await readFile(path,'utf8');
  const checked=spawnSync(process.execPath,['--check','--input-type=module'],{input:code,encoding:'utf8'});assert.equal(checked.status,0,`${name}: ${checked.stderr}`);
  for(const [,specifier] of code.matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g)){
   if(specifier.startsWith('.'))assert.ok((await stat(resolve(dirname(path),specifier))).isFile(),`${name} -> ${specifier}`);else assert.ok(map[specifier],`${name} -> ${specifier}`);
  }
 }
});
test('Italy shares the country shell and appears in navigation, globe, passport and likes',async()=>{
 const config=JSON.parse(html.match(/id="world-shell-config">(.*?)<\/script>/s)[1]);assert.equal(config.id,'italy');assert.equal(config.zone,'Europe/Rome');
 for(const id of ['world-header','world-notes','world-loading','world-clock'])assert.equal([...html.matchAll(new RegExp(`id="${id}"`,'g'))].length,1);
 const app=await readFile(resolve(root,'dist/app.js'),'utf8');assert.match(app,/id:'italy'.*href:'italy.html', ready:true/);assert.match(app,/IT:'italy',ITA:'italy'/);assert.match(app,/italy:'IT'/);
 const worker=await import('../worker/index.js');assert.ok(worker.COUNTRY_IDS.includes('italy'));
 const server=(await import('../dist/server/index.js')).default;
 for(const route of ['/italy','/italy.html','/assets/italy-worlds/src/main.js','/italy-world.css'])assert.equal((await server.fetch(new Request('https://example.test'+route),{})).status,200,route);
});
