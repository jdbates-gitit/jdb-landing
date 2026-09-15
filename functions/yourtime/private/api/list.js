import {readState,validateState,boundedJson,json} from '../../../../server/list.mjs';
export async function onRequest({request,env}){
 if(request.method==='GET')return json(await readState(env.YOURTIME_DB));
 if(request.method!=='PUT')return json({error:'Method not allowed.'},405);
 if(request.headers.get('Origin')!=='https://jdb-builds.com'||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Please save from Your Time.'},403);
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))return json({error:'JSON required.'},415);
 const match=request.headers.get('If-Match');
 if(!/^"\d{1,12}"$/.test(match||''))return json({error:'Refresh your list before saving.'},428);
 let state;try{state=validateState(await boundedJson(request));}catch{return json({error:'That change could not be saved. Use titles up to 100 characters and at most 100 custom ideas.'},400);}
 const revision=Number(match.slice(1,-1));
 const result=await env.YOURTIME_DB.prepare('UPDATE yourtime_list SET state=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?').bind(JSON.stringify(state),revision).run();
 if(result.meta.changes!==1)return json({error:'Your list changed in another tab or device. Reload it before making this change.'},409);
 return json({revision:revision+1,state});
}
