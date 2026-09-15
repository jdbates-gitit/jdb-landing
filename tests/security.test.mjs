import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,SignJWT,createLocalJWKSet,exportJWK} from 'jose';
import {verifyIdentity} from '../server/auth.mjs';
import {validateState,publicState,boundedJson} from '../server/list.mjs';
import {onRequest as write} from '../functions/yourtime/private/api/list.js';
import {onRequest as gate} from '../functions/yourtime/private/_middleware.js';
const env={YOURTIME_ACCESS_ISSUER:'https://example.cloudflareaccess.com',YOURTIME_ACCESS_AUD:'test-audience',YOURTIME_OWNER_EMAIL:'owner@example.com'};
const {privateKey,publicKey}=await generateKeyPair('RS256');
const jwk=await exportJWK(publicKey);jwk.kid='test';
const keys=createLocalJWKSet({keys:[jwk]});
const req=(token,url='https://jdb-builds.com/yourtime/private/api/list')=>new Request(url,{headers:{'Cf-Access-Jwt-Assertion':token}});
async function token({email='owner@example.com',aud='test-audience',iss=env.YOURTIME_ACCESS_ISSUER,expiry='1h'}={}){return new SignJWT({email}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuedAt().setExpirationTime(expiry).setIssuer(iss).setAudience(aud).setSubject('test-user').sign(privateKey);}
test('only the signed intended identity is authorized',async()=>{assert.equal(await verifyIdentity(req(await token()),env,keys),true);});
test('reject wrong email, audience, issuer, expiry, signature and alternate hostname',async()=>{
 for(const x of [{email:'other@example.com'},{aud:'another-app'},{iss:'https://other.cloudflareaccess.com'},{expiry:'-1h'}])await assert.rejects(verifyIdentity(req(await token(x)),env,keys));
 const signed=await token(),parts=signed.split('.');parts[2]=(parts[2][0]==='a'?'b':'a')+parts[2].slice(1);
 await assert.rejects(verifyIdentity(req(parts.join('.')),env,keys));
 await assert.rejects(verifyIdentity(req(signed,'https://jdb-landing.pages.dev/yourtime/private'),env,keys));
 await assert.rejects(verifyIdentity(req(signed),{},keys));
});
test('missing auth never reaches private storage',async()=>{let reached=false;const response=await gate({request:new Request('https://jdb-builds.com/yourtime/private'),env,next:async()=>{reached=true;return new Response('leak');}});assert.equal(response.status,403);assert.equal(reached,false);assert.equal(response.headers.get('Cache-Control'),'no-store');});
const empty=()=>({saved:[],completed:[],custom:[],deleted:[]});
const own={id:'own-11111111-1111-4111-8111-111111111111',title:'Train journey'};
test('public output contains saved ideas but never deleted or unsaved ones',()=>{
 const state=validateState({...empty(),custom:[own],deleted:[{idea:{...own,id:'own-22222222-2222-4222-8222-222222222222'},index:0,wasSaved:true,wasCompleted:false}]});
 assert.deepEqual(publicState(state),{saved:[],completed:[],custom:[]});
 state.saved=[own.id];assert.equal(publicState(state).custom.length,1);assert.ok(!('deleted' in publicState(state)));
});
test('validates input bounds, references, duplicates and completion state',()=>{
 for(const state of [{...empty(),saved:['unknown']},{...empty(),custom:[own,own]},{...empty(),custom:[{...own,title:'x'.repeat(101)}]},{...empty(),completed:['slow-travel']},{...empty(),saved:['slow-travel','slow-travel']},{...empty(),custom:Array(101).fill(own)}])assert.throws(()=>validateState(state));
 assert.deepEqual(validateState(empty()),{custom:[],saved:[],completed:[],deleted:[]});
});
test('bounded body rejects oversized content',async()=>{await assert.rejects(boundedJson(new Request('https://example.com',{method:'POST',body:'x'.repeat(65537)})));});
const put=(headers={},body=empty())=>new Request('https://jdb-builds.com/yourtime/private/api/list',{method:'PUT',headers:{Origin:'https://jdb-builds.com','Content-Type':'application/json','If-Match':'"0"',...headers},body:JSON.stringify(body)});
test('writes require same-origin, JSON and revision',async()=>{
 for(const [headers,status] of [[{Origin:'https://evil.example'},403],[{'Content-Type':'text/plain'},415],[{'If-Match':''},428],[{'Sec-Fetch-Site':'cross-site'},403]])assert.equal((await write({request:put(headers),env:{}})).status,status);
});
test('revision check prevents concurrent overwrite',async()=>{
 let revision=0;const db={prepare:sql=>{assert.match(sql,/WHERE id=1 AND revision=\?/);return {bind:(state,expected)=>({run:async()=>({meta:{changes:expected===revision?(revision++,1):0}})})};}};
 assert.equal((await write({request:put(),env:{YOURTIME_DB:db}})).status,200);
 assert.equal((await write({request:put(),env:{YOURTIME_DB:db}})).status,409);
});
