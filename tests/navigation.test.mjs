import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname,'..');
const home = await readFile(join(root,'index.html'),'utf8');

test('personal opening, original work story and unique build cards are retained',()=>{
  assert.match(home,/Curious about the world[\s\S]*?Learning as I go\./);
  assert.match(home,/I started as a Loan Origination Assistant/);
  assert.equal((home.match(/class="jdb-build"/g)||[]).length,5);
  assert.equal((home.match(/class="jdb-fun-card"/g)||[]).length,6);
  assert.equal((home.match(/class="jdb-tl"/g)||[]).length,6);
  assert.match(home,/20\/20/);assert.match(home,/85\/85/);
});
test('production has no preview dialog, snapshots, noindex or Cynthia menu links',()=>{
  assert.doesNotMatch(home,/jdb-preview-dialog|PRIVATE CONCEPT|Nothing published|noindex|daily-signal\.html|daily-discipline\.html|href="[^"]*yourtime/i);
  assert.match(home,/href="https:\/\/briefing\.jdb-builds\.com/);
  assert.match(home,/href="https:\/\/discipline\.jdb-builds\.com/);
});
test('legacy homepage hashes retain their public meaning and native links are guarded',async()=>{
  const script=await readFile(join(root,'assets/home.js'),'utf8');
  for(const hash of ['#about','#stack','#experience','#builds','#professional-builds','#personal-about','#fun','#connect','#work'])assert(script.includes("'"+hash+"'"));
  assert.match(script,/event\.ctrlKey/);assert.match(script,/event\.metaKey/);assert.match(script,/link\.target/);
  assert.match(script,/destination\.focus/);assert.match(script,/popstate/);
});
test('every main-site page and Notes article has the shared home navigation',async()=>{
  const files=(await readdir(root)).filter(file=>file.endsWith('.html')&&file!=='index.html');
  files.push(...(await readdir(join(root,'notes'))).filter(file=>file.endsWith('.html')).map(file=>'notes/'+file));
  assert.equal(files.length,16);
  for(const file of files){
    const text=await readFile(join(root,file),'utf8');
    assert.equal((text.match(/id="jdb-site-navigation"/g)||[]).length,1,file);
    assert.match(text,/class="jdb-brand" href="\/"/,file);
    assert.match(text,/assets\/site-navigation\.css\?v=/,file);
    assert.match(text,/assets\/site-navigation\.js\?v=/,file);
    assert.match(text,/href="\/websites"/,file);
    assert.doesNotMatch(text,/PRIVATE CONCEPT|noindex,nofollow|data-private-retired-nav/,file);
  }
});
test('home asset URLs exist, and public build does not include project internals',async()=>{
  for(const [,url] of home.matchAll(/(?:src|href)="(\/assets\/[^"?]+)(?:\?[^" ]*)?"/g))assert((await stat(join(root,url))).isFile());
  const build=await readFile(join(root,'scripts/build.mjs'),'utf8');
  assert.match(build,/\['assets',\s*'notes',\s*'yourtime'\]/);
  assert.doesNotMatch(build,/\['_backups|\['server|\['tests/);
});
