import {createRemoteJWKSet,jwtVerify} from 'jose';
export const ORIGIN='https://jdb-builds.com';
export async function verifyIdentity(request,env,keys) {
 if(new URL(request.url).origin!==ORIGIN) throw new Error('host');
 if(!env.YOURTIME_ACCESS_ISSUER || !env.YOURTIME_ACCESS_AUD || !env.YOURTIME_OWNER_EMAIL) throw new Error('config');
 const issuer=env.YOURTIME_ACCESS_ISSUER;
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)) throw new Error('config');
 const token=request.headers.get('Cf-Access-Jwt-Assertion');
 if(!token || token.length>16384) throw new Error('token');
 const jwks=keys??createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs'),{timeoutDuration:5000});
 const {payload}=await jwtVerify(token,jwks,{issuer,audience:env.YOURTIME_ACCESS_AUD,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email']});
 if(typeof payload.email!=='string' || payload.email.toLowerCase()!==env.YOURTIME_OWNER_EMAIL.toLowerCase()) throw new Error('identity');
 return true;
}
export function secure(response) {
 const result=new Response(response.body,response);
 result.headers.set('Cache-Control','no-store');
 result.headers.set('X-Content-Type-Options','nosniff');
 result.headers.set('X-Frame-Options','DENY');
 result.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 result.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
 return result;
}
