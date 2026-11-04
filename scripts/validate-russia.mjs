import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../dist');
const html=await readFile(path.join(root,'russia.html'),'utf8');const imports=JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/s)[1]).imports;
const seen=new Set();
function resolve(s,parent){if(s.startsWith('.'))return path.posix.normalize(path.posix.join(path.posix.dirname(parent),s));for(const[k,v]of Object.entries(imports))if(s===k||k.endsWith('/')&&s.startsWith(k))return path.posix.normalize(v+(k.endsWith('/')?s.slice(k.length):''));throw Error('Unresolved Moscow import '+s);}
async function visit(p){if(seen.has(p))return;seen.add(p);if(p.includes('://')||p.startsWith('..'))throw Error('Nonlocal Russia dependency '+p);const s=await readFile(path.join(root,p),'utf8');const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:s,encoding:'utf8'});if(check.status)throw Error(p+': '+check.stderr);for(const m of s.matchAll(/^\s*(?:import\b[^;\n]*?\bfrom\s*|export\b[^;\n]*?\bfrom\s*)(['"])([^'"]+)\1/gm))await visit(resolve(m[2],p));}
await visit('assets/russia-worlds/src/main.js');console.log(`Russia dependency graph: ${seen.size} local, parseable modules.`);
