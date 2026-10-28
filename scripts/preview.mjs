import http from 'node:http';
import {mkdirSync} from 'node:fs';
import worker from '../dist/server/index.js';
import {openDatabase} from './local-db.mjs';
mkdirSync(new URL('../work/',import.meta.url),{recursive:true});
const db=openDatabase(new URL('../work/preview.sqlite',import.meta.url).pathname),port=Number(process.env.PORT||8766);
const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers:req.headers,...(body.length?{body}:{} )});const response=await worker.fetch(request,{DB:db});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){console.error(e);res.writeHead(500);res.end('Preview error');}});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
