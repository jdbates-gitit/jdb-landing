// Local-only UI harness. Never included in the deployed output.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {validateState,publicState} from '../server/list.mjs';
const root=resolve(import.meta.dirname,'../dist');
let state={saved:[],completed:[],custom:[],deleted:[]},revision=0;
http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://127.0.0.1:8898');
 if(url.pathname.endsWith('/api/list')){
  if(req.method==='PUT'){
   let body='';for await(const chunk of req)body+=chunk;
   if(req.headers['if-match']!=='"'+revision+'"'){res.writeHead(409,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Conflict. Reload.'}));}
   state=validateState(JSON.parse(body));revision++;
  }
  res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
  return res.end(JSON.stringify(url.pathname.includes('/private/')?{state,revision}:publicState(state)));
 }
 const target=resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
 if(!target.startsWith(root+sep))throw new Error('path');
 const content=await readFile(target);res.writeHead(200,{'Content-Type':({'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png'})[extname(target)]||'application/octet-stream'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(8898,'127.0.0.1',()=>console.log('Local Your Time test page: http://127.0.0.1:8898/yourtime/'));
