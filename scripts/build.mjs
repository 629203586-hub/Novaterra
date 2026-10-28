import {readFile,writeFile,mkdir,readdir,rm,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const assets={};
async function walk(dir,prefix='') {
  for(const e of await readdir(dir,{withFileTypes:true})) {
    if(e.name.startsWith('.')||['server','node_modules'].includes(e.name))continue;
    const relative=`${prefix}/${e.name}`;
    if(e.isDirectory())await walk(path.join(dir,e.name),relative);
    else {const type=mime[path.extname(e.name)];if(!type)throw Error(`Unsupported asset: ${relative}`);const text=await readFile(path.join(dir,e.name),'utf8');assets[relative]={text,type,etag:`"${createHash('sha256').update(text).digest('hex').slice(0,20)}"`};}
  }
}
await walk(path.join(root,'dist'));
for(const required of ['/index.html','/china.html','/japan.html','/france.html','/russia.html','/greenland.html','/germany.html','/usa.html','/switzerland.html','/korea.html'])if(!assets[required])throw Error(`Missing ${required}`);
await mkdir(path.join(root,'dist/server'),{recursive:true});
await mkdir(path.join(root,'dist/.openai'),{recursive:true});
await writeFile(path.join(root,'dist/server/index.js'),`${await readFile(path.join(root,'worker/index.js'),'utf8')}\nexport default createSite(${JSON.stringify(assets)});\n`);
await cp(path.join(root,'.openai/hosting.json'),path.join(root,'dist/.openai/hosting.json'));
await rm(path.join(root,'dist/.openai/drizzle'),{recursive:true,force:true});
await cp(path.join(root,'drizzle'),path.join(root,'dist/.openai/drizzle'),{recursive:true});
console.log(`Bundled ${Object.keys(assets).length} static assets with the shared likes API.`);
