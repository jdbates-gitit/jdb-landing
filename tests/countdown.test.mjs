import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const code=await readFile(new URL('../yourtime/site.js',import.meta.url),'utf8');
const context={Intl,Date,document:{getElementById:()=>({})},output:null};
const segment=code.slice(code.indexOf(" const target"),code.indexOf(' function tick'));
vm.runInNewContext(segment+';output={countdownParts,calendarDifference};',context);
const parts=date=>Array.from(context.output.countdownParts(Date.parse(date)));
test('countdown reaches zero and then counts up in six units',()=>{
 assert.deepEqual(parts('2029-12-31T05:59:59Z'),[0,0,0,0,0,1]);
 assert.deepEqual(parts('2029-12-31T06:00:00Z'),[0,0,0,0,0,0]);
 assert.deepEqual(parts('2029-12-31T06:00:01Z'),[0,0,0,0,0,1]);
 assert.deepEqual(parts('2030-12-31T18:30:00Z'),[1,0,0,12,30,0]);
});
test('calendar month ends are clamped and leap years are handled',()=>{
 const diff=(a,b)=>Array.from(context.output.calendarDifference(Date.parse(a),Date.parse(b)));
 assert.deepEqual(diff('2028-01-31T12:00:00-06:00','2028-02-29T12:00:00-06:00'),[0,1,0,0,0,0]);
 assert.deepEqual(diff('2028-02-29T12:00:00-06:00','2029-02-28T12:00:00-06:00'),[1,0,0,0,0,0]);
});
