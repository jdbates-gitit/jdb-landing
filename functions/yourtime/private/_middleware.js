import {verifyIdentity,secure} from '../../../server/auth.mjs';
export async function onRequest(context) {
 try {await verifyIdentity(context.request,context.env);}
 catch {return secure(new Response('Please sign in through Your Time to open your private space.',{status:403}));}
 try {return secure(await context.next());}
 catch {console.error('yourtime_private_request_failed');return secure(new Response('Your space is temporarily unavailable. Please try again.',{status:503}));}
}
