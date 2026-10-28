import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {formatClock,isSceneReady} from '../dist/world-shell.js';
const pages=['japan','station','china','france','russia','greenland','germany','usa','switzerland','korea'];
test('every open world has a clock, its own notes and the common loading screen',async()=>{
 const ids=new Set();
 for(const page of pages){const html=await readFile(new URL(`../dist/${page}.html`,import.meta.url),'utf8');const config=JSON.parse(html.match(/<script type="application\/json" id="world-shell-config">([\s\S]*?)<\/script>/)[1]);assert.ok(config.story&&config.controls&&config.timeNote);assert.doesNotThrow(()=>formatClock(new Date(),config.zone));assert.match(html,/id="world-clock"/);assert.match(html,/id="world-notes"/);assert.match(html,/id="world-loading"/);assert.match(html,/href="world-shell.css"/);assert.match(html,/src="world-shell.js"/);if(page!=='station')ids.add(config.id);}
 assert.equal(ids.size,9);
});
test('world clocks use each selected time zone and handle daylight saving changes',()=>{
 const now=new Date('2026-01-15T12:00:00Z');
 assert.equal(formatClock(now,'Asia/Tokyo'),'21:00');assert.equal(formatClock(now,'Asia/Shanghai'),'20:00');assert.equal(formatClock(now,'Europe/Paris'),'13:00');assert.equal(formatClock(now,'America/Chicago'),'06:00');
 assert.equal(formatClock(new Date('2026-03-29T00:30:00Z'),'Europe/Berlin'),'01:30');assert.equal(formatClock(new Date('2026-03-29T01:30:00Z'),'Europe/Berlin'),'03:30');
});
test('loading waits for the corresponding scene engine instead of treating document load as ready',()=>{
 const pending={querySelector:()=>({classList:{contains:()=>false}})},done={querySelector:()=>({classList:{contains:name=>name==='done'}})};
 assert.equal(isSceneReady({},pending),false);assert.equal(isSceneReady({__sceneReady:true},pending),true);assert.equal(isSceneReady({__seoulReady:true},pending),true);assert.equal(isSceneReady({littleWorld:{ready:false}},pending),false);assert.equal(isSceneReady({littleWorld:{ready:true}},pending),true);assert.equal(isSceneReady({},done),true);
});
test('inline scene scripts remain valid after adding the shared shell',async()=>{
 for(const page of pages){const html=await readFile(new URL(`../dist/${page}.html`,import.meta.url),'utf8');for(const[,attrs,script]of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(/type="(?:importmap|application\/json)"|\bsrc=/.test(attrs)||!script.trim())continue;const r=spawnSync(process.execPath,['--check','--input-type=module'],{input:script,encoding:'utf8'});assert.equal(r.status,0,`${page}: ${r.stderr}`);}}
});

test('Route 66 keeps its original sunset palette and the adapted embedded runtime is valid JavaScript',async()=>{
 const html=await readFile(new URL('../dist/usa.html',import.meta.url),'utf8');
 const map=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
 const decode=name=>Buffer.from(map.imports[name].split(',')[1],'base64').toString('utf8');
 assert.match(decode('lw/project.config.js'),/#805c46/i);
 const runtime=decode('lw/src/core/runtime.js');const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:runtime,encoding:'utf8'});assert.equal(check.status,0,check.stderr);
});
