import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const page=await readFile(join(root,'games.html'),'utf8');
test('launch page provides five independent live game destinations',()=>{
  const cards=[...page.matchAll(/<a class="game-card"[\s\S]*?<\/a>/g)].map(m=>m[0]);
  assert.equal(cards.length,5);
  const games=[['battlefield','Battlefield',''],['last-line','Last Line','last-line/'],['lost-orbit','Lost Orbit','lost-orbit/'],['hollowtown','Hollowtown','hollowtown/'],['flightschool','Pencil FlightSchool','pencil-flightschool/']];
  games.forEach(([id,name,route],i)=>{assert.match(cards[i],new RegExp('data-game="'+id+'"'));assert(cards[i].includes('>'+name+'</h2>'));assert(cards[i].includes('href="https://pencilwars.jdb-builds.com/'+route+'"'));assert(cards[i].includes('aria-labelledby="game-'+id+'"'));});
  assert.match(page,/Small beginnings\./);assert.match(page,/Big worlds\./);
  assert.match(page,/href="\/websites#playful-builds"/);
  assert.match(page,/href="https:\/\/jdb-builds\.com\/games"/);
  assert.doesNotMatch(page,/iframe|fetch\(|localStorage|sessionStorage|api\/|yourtime|watchtower/i);
  assert.equal((page.match(/<script\b/g)||[]).length,1);
});
test('launch artwork and stylesheet are local and build-ready',async()=>{
  const art=[...page.matchAll(/<img[^>]+src="([^"]+)"[^>]+>/g)];
  assert.equal(art.length,5);
  for(const [tag,src]of art){assert(src.startsWith('/assets/games/'));assert((await stat(join(root,src))).isFile());assert.match(tag,/alt="[^"]+"/);assert.match(tag,/width="\d+" height="\d+"/);}
  const css=await readFile(join(root,'assets/games.css'),'utf8');
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.games-grid\{grid-template-columns:1fr/);
  assert.match(css,/prefers-reduced-motion/);assert.match(css,/focus-visible/);
});
