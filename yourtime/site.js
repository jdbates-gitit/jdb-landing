
(() => {
 'use strict';
 const target = Date.parse('2029-12-31T00:00:00-06:00');
 const units = ['years','months','days','hours','minutes','seconds'].map(id=>document.getElementById(id));
 const calendar = new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric',hourCycle:'h23'});
 // Calendar components use America/Chicago, independent of the viewer's time zone.
 function civil(epoch){
  return Object.fromEntries(calendar.formatToParts(new Date(epoch)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
 }
 function calendarDifference(start,end){
  const p=civil(start),q=civil(end);
  const finish=Date.UTC(q.year,q.month-1,q.day,q.hour,q.minute,q.second);
  function plusMonths(months){
   const first=new Date(Date.UTC(p.year,p.month-1+months,1)),y=first.getUTCFullYear(),m=first.getUTCMonth();
   return Date.UTC(y,m,Math.min(p.day,new Date(Date.UTC(y,m+1,0)).getUTCDate()),p.hour,p.minute,p.second);
  }
  let months=Math.max(0,(q.year-p.year)*12+q.month-p.month);
  if(plusMonths(months)>finish)months=Math.max(0,months-1);
  const rest=Math.max(0,Math.floor((finish-plusMonths(months))/1000));
  return [Math.floor(months/12),months%12,Math.floor(rest/86400),Math.floor(rest/3600)%24,Math.floor(rest/60)%60,rest%60];
 }
 function countdownParts(now){return now<target?calendarDifference(now,target):calendarDifference(target,now);}

 function tick(now=Date.now()){
  const retired=now>=target,values=countdownParts(now);
  units.forEach((node,i)=>node.textContent=String(values[i]).padStart(2,'0'));
  document.getElementById('clock-heading').textContent=!retired?'Your countdown to retirement':now-target<60000?'Your time starts now, Cynthia.':'Enjoying life on your time for…';
  document.getElementById('retirement-clock').setAttribute('aria-label',retired?'Time since your retirement on December 31, 2029':'Time remaining until December 31, 2029, midnight Central time');
  document.getElementById('hero-note').textContent=retired?'No finish line here. Just more days to make your own.':'Not an ending. A very well-earned change of pace.';
 }
 tick();window.setInterval(tick,1000);
 const originals=[
  {id:'slow-travel',category:'Go somewhere',title:'Take the scenic route.',description:'A train through somewhere beautiful. A window seat. No meeting waiting at the other end.'},
  {id:'slow-mornings',category:'Do less, beautifully',title:'Become a slow-morning person.',description:'Coffee on the patio. A book that stays open. Absolutely no reason to check the time.'},
  {id:'new-skill',category:'Try a first',title:'Be a beginner. Just for fun.',description:'Pottery, piano, painting, a new language. Pick something because it sounds wonderful—not useful.'},
  {id:'long-table',category:'Make room for people',title:'Set a table that runs late.',description:'Long lunches, family dinners, and conversations that get to finish themselves.'},
  {id:'weekday-trip',category:'Follow a whim',title:'Leave on a Tuesday.',description:'A weekday road trip. An extra night somewhere lovely. Stay because you want to.'},
  {id:'ordinary-magic',category:'Find everyday joy',title:'Collect little rituals.',description:'A garden to tend. A favorite walking trail. Live music on a weeknight. The good, ordinary stuff.'}
 ];

 const editable=document.body.dataset.mode==='private';
 let saved=new Set(),completed=new Set(),custom=[],deleted=[],view='all',revision=0,ready=false,busy=false,lastState=null;
 const endpoint=editable?'/yourtime/private/api/list':'/yourtime/api/list';
 function snapshot(){return {saved:[...saved],completed:[...completed],custom,deleted};}
 function apply(state){saved=new Set(state.saved);completed=new Set(state.completed);custom=state.custom;deleted=state.deleted||[];}
 function controlsDisabled(value){document.querySelectorAll('#ideas button,#add-form input,#add-form button,#undo-row button').forEach(el=>el.disabled=value);}
 async function load(){
  controlsDisabled(true);
  try{
   const response=await fetch(endpoint,{cache:'no-store',redirect:'error'});
   if(!response.ok)throw new Error('load');
   const payload=await response.json();apply(editable?payload.state:payload);
   revision=editable?payload.revision:0;lastState=structuredClone(snapshot());ready=true;render();controlsDisabled(false);
  }catch{ready=false;document.getElementById('status').textContent=editable?'Your list could not be loaded. Your session may have expired. Sign out and sign in again, or reload this page.':'Your saved list could not be loaded. Refresh to try again; the possibilities below are still here.';controlsDisabled(true);}
 }
 async function persist(){
  if(!ready||busy||!editable)return false;
  busy=true;controlsDisabled(true);
  document.getElementById('status').textContent='Saving…';
  try{
   const response=await fetch(endpoint,{method:'PUT',headers:{'Content-Type':'application/json','If-Match':'"'+revision+'"'},body:JSON.stringify(snapshot()),redirect:'error'});
   if(!response.ok){const issue=await response.json().catch(()=>({}));throw new Error(issue.error||'Your session may have expired. Reload or sign in again.');}
   const result=await response.json();revision=result.revision;apply(result.state);lastState=structuredClone(snapshot());return true;
  }catch(error){
   apply(structuredClone(lastState));render();document.getElementById('status').textContent='Not saved: '+error.message;return false;
  }finally{busy=false;controlsDisabled(false);}
 }
 function element(tag,className,text){const el=document.createElement(tag);el.className=className;if(text)el.textContent=text;return el;}
 function render(){
  const all=[...originals,...custom],grid=document.getElementById('ideas');grid.replaceChildren();
  if(editable)document.getElementById('undo-row').hidden=deleted.length===0;
  if(editable&&deleted.length)document.getElementById('undo-message').textContent='Deleted “'+deleted[deleted.length-1].idea.title+'”.';
  document.getElementById('saved-count').textContent=all.filter(x=>saved.has(x.id)&&!completed.has(x.id)).length;
  document.getElementById('done-count').textContent=all.filter(x=>completed.has(x.id)).length;
  all.forEach((idea,i)=>{const done=completed.has(idea.id);if(view==='saved'&&(!saved.has(idea.id)||done))return;if(view==='done'&&!done)return;const chosen=saved.has(idea.id),card=element('article','idea'+(done?' completed':chosen?' saved':''));
   const top=element('div','idea-top');top.append(element('span','idea-no',String(i+1).padStart(2,'0')),element('span','category',idea.category));
   const button=element('button','save',chosen?'✓ On your list · Remove':'+ Save to your list');button.type='button';button.setAttribute('aria-pressed',String(chosen));button.setAttribute('aria-label',(chosen?'Remove ':'Save ')+idea.title+(chosen?' from your list':' to your list'));
   button.addEventListener('click',async()=>{const wasSaved=saved.has(idea.id);if(wasSaved)saved.delete(idea.id);else saved.add(idea.id);if(!await persist())return;render();document.getElementById('status').textContent=wasSaved?'Removed from your list.':'Added to your list.';const restored=[...grid.querySelectorAll('button')].find(b=>b.dataset.id===idea.id);if(restored)restored.focus();});button.dataset.id=idea.id;
   const actions=element('div','idea-actions');if(!done)actions.append(button);
   const didIt=element('button','done-button',done?'✓ Did it! · Undo':'Did it!');
   didIt.type='button';didIt.dataset.id=idea.id;didIt.setAttribute('aria-pressed',String(done));didIt.setAttribute('aria-label',(done?'Undo completion: ':'Mark completed: ')+idea.title);
   didIt.addEventListener('click',async()=>{
    if(completed.has(idea.id))completed.delete(idea.id);else{completed.add(idea.id);saved.add(idea.id);}
    if(!await persist())return;render();document.getElementById('status').textContent=done?'Back on your someday list.':'You did it! Saved with your completed adventures.';
    const restored=[...document.querySelectorAll('.done-button')].find(x=>x.dataset.id===idea.id);if(restored)restored.focus();else document.querySelector('[data-view="'+view+'"]').focus();
   });actions.append(didIt);
   if(custom.some(x=>x.id===idea.id)){
    const remove=element('button','delete-idea','Delete idea ×');remove.type='button';remove.setAttribute('aria-label','Delete custom idea: '+idea.title);
    remove.addEventListener('click',async()=>{
     const index=custom.findIndex(x=>x.id===idea.id);if(index<0)return;
     if(deleted.length>=100)deleted.shift();
     deleted.push({idea:custom[index],index,wasSaved:saved.has(idea.id),wasCompleted:completed.has(idea.id)});
     custom.splice(index,1);saved.delete(idea.id);completed.delete(idea.id);if(!await persist())return;render();document.getElementById('status').textContent='Idea removed from your public list. You can undo this below.';document.getElementById('undo-delete').focus();
    });actions.append(remove);
   }
   card.append(top,element('h3','',idea.title));if(done)card.append(element('div','completed-label','A someday, now a memory.'));card.append(element('p','',idea.description));if(editable)card.append(actions);grid.append(card);
  });
  if(!grid.children.length)grid.append(element('p','empty',view==='done'?'Your completed adventures will live here. Mark an idea “Did it!” whenever you like.':'Your list is a blank page—in the best way. Save a possibility or add an idea below.'));
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  if(editable)controlsDisabled(busy||!ready);
 }
 if(editable){
 document.getElementById('clear-deleted').addEventListener('click',async()=>{
  if(!deleted.length)return;
  if(!window.confirm('Permanently clear deleted ideas? You will no longer be able to undo those deletions. Your active ideas will stay.'))return;
  deleted=[];if(!await persist())return;render();document.getElementById('status').textContent='Deleted history cleared. Your active ideas are unchanged.';
  document.getElementById('new-idea').focus();
 });
 document.getElementById('undo-delete').addEventListener('click',async()=>{
  if(!deleted.length)return;
  if(custom.length>=100){document.getElementById('status').textContent='Remove an idea before restoring another; your list holds 100 custom ideas.';return;}
  const entry=deleted.pop();
  if(!custom.some(x=>x.id===entry.idea.id))custom.splice(Math.max(0,Math.min(entry.index||0,custom.length)),0,entry.idea);
  if(entry.wasSaved)saved.add(entry.idea.id);if(entry.wasCompleted)completed.add(entry.idea.id);view='all';if(!await persist())return;render();
  document.getElementById('status').textContent='Your deleted idea has been restored.';
  const restored=[...document.querySelectorAll('.save')].find(b=>b.dataset.id===entry.idea.id);if(restored)restored.focus();
 });
 }
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',async()=>{view=b.dataset.view;render();}));
 if(editable)document.getElementById('add-form').addEventListener('submit',async event=>{event.preventDefault();const input=document.getElementById('new-idea'),title=input.value.trim();if(!title)return;if(custom.length>=100){document.getElementById('status').textContent='Your list holds up to 100 custom ideas.';return;}const id='own-'+crypto.randomUUID();custom.push({id,title,category:'Your own idea',description:'A possibility worth making room for.'});saved.add(id);if(!await persist())return;view='saved';render();input.value='';document.getElementById('status').textContent='Your idea is on the list.';});
 render();void load();
})();
