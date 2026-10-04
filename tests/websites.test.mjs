import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const gallery=await readFile(join(root,'websites.html'),'utf8');

test('gallery has nine public destinations and one noninteractive private preview',()=>{
  assert.equal((gallery.match(/data-visibility="public"/g)||[]).length,9);
  assert.equal((gallery.match(/data-visibility="private"/g)||[]).length,1);
  const privateCard=gallery.match(/<article[^>]+data-site-id="your-time"[\s\S]*?<\/article>/)?.[0];
  assert(privateCard);assert.match(privateCard,/Private.*preview/);
  assert.doesNotMatch(privateCard,/<a\b|<button\b|<input\b|<select\b|<textarea\b|tabindex|onclick|href=/i);
  assert.doesNotMatch(gallery,/href="[^" ]*(?:yourtime|watchtower)|\/yourtime\/|api\/list|cynthiaplitt68/i);
  for(const domain of ['inmemoryoflindakay.org','jennilynn.net','pencilwars.jdb-builds.com','rewind.jdb-builds.com','briefing.jdb-builds.com','discipline.jdb-builds.com','jdb-memorial-demo.pages.dev'])assert(gallery.includes('href="https://'+domain+'/"'),domain);
  assert.match(gallery,/href="https:\/\/jdb-builds\.com\/date-night"/);
  assert.match(gallery,/href="https:\/\/jdb-builds\.com\/"/);
  assert.equal((gallery.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,9);
});
test('all ten previews are local, content-versioned snapshots',async()=>{
  const images=[...gallery.matchAll(/<img src="(\/assets\/websites\/[^"?]+)\?v=([a-f0-9]+)"[^>]+>/g)];
  assert.equal(images.length,10);
  for(const [tag,path,version] of images){
    const file=await readFile(join(root,path));
    assert.equal(createHash('sha256').update(file).digest('hex').slice(0,12),version,path);
    assert.match(tag,/loading="lazy"/);assert.match(tag,/width="\d+" height="\d+"/);
  }
  assert.match(gallery,/not live embeds/);assert.match(gallery,/fictional demonstration/);
  assert.doesNotMatch(gallery,/<iframe|fetch\(|localStorage|OPENAI_API_KEY/i);
  assert.equal((await readdir(join(root,'assets/websites'))).filter(file=>file.endsWith('.jpg')).length,10);
});
test('the gallery and homepage entrance retain responsive image sizing',async()=>{
  const css=await readFile(join(root,'assets/websites.css'),'utf8');
  const entrance=await readFile(join(root,'assets/websites-gateway.css'),'utf8');
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/gallery-grid\{grid-template-columns:1fr/);
  assert.match(css,/website-frame img\{height:auto\}/);
  assert.match(entrance,/height:auto;aspect-ratio:1\.6/);
  assert.match(css,/prefers-reduced-motion/);
});
