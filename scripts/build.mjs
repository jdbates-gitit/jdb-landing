import { mkdir, readdir, copyFile, cp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
// An allowlisted output keeps functions, configuration, tests and secrets off the website.
const root=resolve(import.meta.dirname,'..'), out=join(root,'dist');
if(out!==join(root,'dist')||out===root)throw new Error('Invalid build directory');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const entry of await readdir(root,{withFileTypes:true})) {
 if(entry.isFile() && (/\.(html|pdf)$/i.test(entry.name)||['_headers','_redirects','_routes.json','robots.txt','favicon.ico'].includes(entry.name))) await copyFile(join(root,entry.name),join(out,entry.name));
 if(entry.isDirectory() && ['assets','notes','yourtime'].includes(entry.name)) await cp(join(root,entry.name),join(out,entry.name),{recursive:true});
}
