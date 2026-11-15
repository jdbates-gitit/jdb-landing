import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const page=await readFile(join(root,'games.html'),'utf8');
test('launch page links to each live game',()=>{
  const cards=[...page.matchAll(/<a class="game-card"[\s\S]*?<\/a>/g)].map(m=>m[0]);
  const host='https://pencilwars.jdb-builds.com/';
  const games=[
    ['battlefield','Battlefield',host],['last-line','Last Line',host+'last-line/'],
    ['lost-orbit','Lost Orbit',host+'lost-orbit/'],['hollowtown','Hollowtown',host+'hollowtown/'],
    ['flightschool','Pencil FlightSchool',host+'pencil-flightschool/'],
    ['hadal-echo','Hadal Echo',host+'hadal-echo/']
  ];
  assert.equal(cards.length,games.length);
  for(const [id,name,url] of games) {
    const card=cards.find(markup=>markup.includes('data-game="'+id+'"'));
    assert(card,id);
    assert(card.includes('>'+name+'</h2>'));
    assert(card.includes('href="'+url+'"'));
    assert(card.match(/aria-labelledby="[^"]+"/)?.[0].includes('game-'+id));
    if(id==='hadal-echo') assert.match(card,/id="play-hadal-echo">Play/);
  }
  assert.match(page,/Small beginnings\./);assert.match(page,/Big worlds\./);
  assert.match(page,/href="\/websites#playful-builds"/);
  assert.match(page,/href="https:\/\/jdb-builds\.com\/games"/);
  assert.doesNotMatch(page,/iframe|fetch\(|localStorage|sessionStorage|api\/|yourtime|watchtower|moonstone/i);
  assert.equal((page.match(/<script\b/g)||[]).length,1);
});
test('launch artwork and stylesheet are local and build-ready',async()=>{
  const art=[...page.matchAll(/<img[^>]+src="([^"]+)"[^>]+>/g)];
  assert.equal(art.length,(page.match(/<a class="game-card" /g)||[]).length);
  for(const [tag,src] of art) {
    const [file,query]=src.split('?');
    assert(file.startsWith('/assets/games/'));
    const bytes=await readFile(join(root,file));
    if(query) assert.equal(query,'v='+createHash('sha256').update(bytes).digest('hex').slice(0,12),file);
    assert.match(tag,/alt="[^"]+"/);
    assert.match(tag,/width="\d+" height="\d+"/);
  }
  const css=await readFile(join(root,'assets/games.css'),'utf8');
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.games-grid\{grid-template-columns:1fr/);
  assert.match(css,/prefers-reduced-motion/);assert.match(css,/focus-visible/);
});
