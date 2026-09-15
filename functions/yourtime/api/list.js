import {readState,publicState,json} from '../../../server/list.mjs';
export async function onRequest({request,env}){
 if(new URL(request.url).origin!=='https://jdb-builds.com')return json({error:'Not available on this address.'},403);
 if(request.method!=='GET')return json({error:'Method not allowed.'},405);
 try{const {state}=await readState(env.YOURTIME_DB);return json(publicState(state));}
 catch{console.error('yourtime_public_list_failed');return json({error:'The list could not be loaded. Please refresh in a moment.'},503);}
}
