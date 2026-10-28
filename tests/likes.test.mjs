import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSite} from '../worker/index.js';
import {openDatabase} from '../scripts/local-db.mjs';
function setup(){const DB=openDatabase(),worker=createSite({'/index.html':{text:'home',type:'text/html',etag:'v1'},'/france.html':{text:'Paris',type:'text/html',etag:'v2'},'/greenland.html':{text:'Greenland',type:'text/html',etag:'v3'},'/germany.html':{text:'Spring Village',type:'text/html',etag:'v4'},'/usa.html':{text:'Last Stop 66',type:'text/html',etag:'v5'},'/switzerland.html':{text:'Alpine Village',type:'text/html',etag:'v6'},'/korea.html':{text:'Seoul',type:'text/html',etag:'v7'}});return {DB,worker};}
const base='https://example.test';
async function session(worker,DB){const response=await worker.fetch(new Request(base+'/api/likes'),{DB});assert.equal(response.status,200);const cookie=response.headers.get('set-cookie').split(';')[0];return {cookie,data:await response.json()};}
async function like(worker,DB,cookie,country='france',liked=true){return worker.fetch(new Request(base+'/api/likes/'+country,{method:'PUT',headers:{origin:base,'content-type':'application/json',cookie},body:JSON.stringify({liked})}),{DB});}
test('shared counts, independent visitors, retries, undo and persistence',async()=>{const {DB,worker}=setup();const a=await session(worker,DB),b=await session(worker,DB);assert.notEqual(a.cookie,b.cookie);assert.equal(a.data.places.france.count,0);assert.deepEqual(await (await like(worker,DB,a.cookie)).json(),{country:'france',count:1,liked:true});const retries=await Promise.all(Array.from({length:12},()=>like(worker,DB,a.cookie)));for(const r of retries)assert.equal((await r.json()).count,1);assert.equal((await(await like(worker,DB,b.cookie)).json()).count,2);const reloaded=await worker.fetch(new Request(base+'/api/likes',{headers:{cookie:a.cookie}}),{DB});assert.deepEqual((await reloaded.json()).places.france,{count:2,liked:true});assert.equal((await(await like(worker,DB,a.cookie,'france',false)).json()).count,1);assert.equal((await(await like(worker,DB,a.cookie,'france',false)).json()).count,1);assert.equal((await(await like(worker,DB,a.cookie,'japan',true)).json()).count,1);DB.raw.close();});
for (const country of ['russia', 'greenland', 'germany', 'usa', 'switzerland', 'korea']) test(`${country} likes persist after reopening the database and remain independent of other destinations`, async () => {
  const directory = mkdtempSync(join(tmpdir(), `elsewhere-${country}-likes-`));
  const filename = join(directory, 'likes.sqlite');
  const worker = createSite({});
  let DB;
  try {
    DB = openDatabase(filename);
    const a = await session(worker, DB), b = await session(worker, DB);
    assert.deepEqual(a.data.places[country], {count: 0, liked: false});
    assert.deepEqual(await (await like(worker, DB, a.cookie, country)).json(), {country, count: 1, liked: true});
    assert.deepEqual(await (await like(worker, DB, b.cookie, 'france')).json(), {country: 'france', count: 1, liked: true});

    DB.raw.close();
    DB = undefined;
    DB = openDatabase(filename);
    const read = async cookie => (await (await worker.fetch(new Request(base + '/api/likes', {headers: {cookie}}), {DB})).json()).places;
    const reloaded = await read(a.cookie);
    assert.deepEqual(reloaded[country], {count: 1, liked: true});
    assert.deepEqual(reloaded.france, {count: 1, liked: false});
    assert.deepEqual(await (await like(worker, DB, a.cookie, country, false)).json(), {country, count: 0, liked: false});
    const otherVisitor = await read(b.cookie);
    assert.deepEqual(otherVisitor[country], {count: 0, liked: false});
    assert.deepEqual(otherVisitor.france, {count: 1, liked: true});
  } finally {
    DB?.raw.close();
    rmSync(directory, {recursive: true, force: true});
  }
});
test('rejects invalid destinations, forged sessions, cross-site writes and malformed state',async()=>{const {DB,worker}=setup();const a=await session(worker,DB);assert.equal((await like(worker,DB,a.cookie,'invalid')).status,404);assert.equal((await like(worker,DB,'elsewhere_visitor='+'a'.repeat(64))).status,409);const cross=await worker.fetch(new Request(base+'/api/likes/china',{method:'PUT',headers:{origin:'https://evil.test','content-type':'application/json',cookie:a.cookie},body:'{"liked":true}'}),{DB});assert.equal(cross.status,403);assert.equal((await like(worker,DB,a.cookie,'china','true')).status,400);assert.equal((await session(worker,DB)).data.places.china.count,0);DB.raw.close();});
test('static page routes and clear unavailable-state response',async()=>{const {DB,worker}=setup();assert.equal(await(await worker.fetch(new Request(base+'/france'),{DB})).text(),'Paris');for(const route of ['/greenland','/greenland.html'])assert.equal(await(await worker.fetch(new Request(base+route),{DB})).text(),'Greenland');for(const route of ['/germany','/germany.html'])assert.equal(await(await worker.fetch(new Request(base+route),{DB})).text(),'Spring Village');for(const route of ['/usa','/usa.html'])assert.equal(await(await worker.fetch(new Request(base+route),{DB})).text(),'Last Stop 66');for(const route of ['/switzerland','/switzerland.html'])assert.equal(await(await worker.fetch(new Request(base+route),{DB})).text(),'Alpine Village');for(const route of ['/korea','/korea.html','/seoul','/seoul.html'])assert.equal(await(await worker.fetch(new Request(base+route),{DB})).text(),'Seoul');assert.equal(await(await worker.fetch(new Request(base+'/'),{DB})).text(),'home');assert.equal((await worker.fetch(new Request(base+'/missing'),{DB})).status,404);assert.equal((await worker.fetch(new Request(base+'/api/likes'),{})).status,503);DB.raw.close();});
