export const ORIGINAL_IDS=['slow-travel','slow-mornings','new-skill','long-table','weekday-trip','ordinary-magic'];
const ownId=/^own-[a-z0-9-]{10,80}$/;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function idea(x){
 if(!plain(x)||typeof x.id!=='string'||!ownId.test(x.id)||typeof x.title!=='string'||!x.title.trim()||x.title.length>100)throw new Error('idea');
 return {id:x.id,title:x.title.trim(),category:'Your own idea',description:'A possibility worth making room for.'};
}
export function validateState(x){
 if(!plain(x)||!['custom','deleted','saved','completed'].every(k=>Array.isArray(x[k])))throw new Error('state');
 if(x.custom.length>100||x.deleted.length>100||x.saved.length>106||x.completed.length>106)throw new Error('limit');
 const custom=x.custom.map(idea),ids=new Set([...ORIGINAL_IDS,...custom.map(x=>x.id)]);
 if(ids.size!==ORIGINAL_IDS.length+custom.length)throw new Error('duplicate');
 const selected=a=>{if(a.some(v=>typeof v!=='string'||!ids.has(v))||new Set(a).size!==a.length)throw new Error('selection');return [...a];};
 const saved=selected(x.saved),completed=selected(x.completed);
 if(completed.some(id=>!saved.includes(id)))throw new Error('completed');
 const deleted=x.deleted.map(d=>{
  if(!plain(d)||!Number.isInteger(d.index)||d.index<0||d.index>100||typeof d.wasSaved!=='boolean'||typeof d.wasCompleted!=='boolean')throw new Error('deleted');
  const value=idea(d.idea);if(ids.has(value.id))throw new Error('duplicate');ids.add(value.id);
  return {idea:value,index:d.index,wasSaved:d.wasSaved,wasCompleted:d.wasCompleted};
 });
 return {custom,saved,completed,deleted};
}
export function publicState(state){
 const ids=new Set(state.saved);
 return {saved:state.saved,completed:state.completed,custom:state.custom.filter(x=>ids.has(x.id))};
}
export function json(value,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function boundedJson(request){
 const reader=request.body?.getReader();if(!reader)throw new Error('body');
 let size=0;const chunks=[];
 try {for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw new Error('large');}chunks.push(value);}}
 finally {reader.releaseLock();}
 const bytes=new Uint8Array(size);let n=0;for(const c of chunks){bytes.set(c,n);n+=c.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export async function readState(db){
 const row=await db.prepare('SELECT revision,state FROM yourtime_list WHERE id=1').first();
 if(!row)throw new Error('missing');return {revision:row.revision,state:validateState(JSON.parse(row.state))};
}
