import http from 'node:http';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../worker/index.mjs';
try{process.loadEnvFile(new URL('../.env',import.meta.url).pathname)}catch{}
fs.mkdirSync(new URL('../.data/',import.meta.url),{recursive:true});
const sqlite=new DatabaseSync(new URL('../.data/radar.sqlite',import.meta.url).pathname);
const DB={prepare(sql){return {bind(...args){return {run:async()=>sqlite.prepare(sql).run(...args),first:async()=>sqlite.prepare(sql).get(...args)}},run:async()=>sqlite.prepare(sql).run()}}};
const env={...process.env,DB};
const server=http.createServer(async(req,res)=>{try{let buffers=[],size=0;for await(const b of req){size+=b.length;if(size>(req.url?.startsWith('/api/poster-submissions')?8*1024*1024:40000)){res.writeHead(413);res.end('{"error":"Payload too large"}');return}buffers.push(b)}const body=Buffer.concat(buffers);const request=new Request('http://localhost:4317'+req.url,{method:req.method,headers:req.headers,...(body.length?{body}:{} )});const response=await worker.fetch(request,env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch(e){res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"Local service error"}')}});server.listen(4317,'127.0.0.1',()=>console.log('Trojan Radar running at http://localhost:4317 · SQLite persistence enabled'));
