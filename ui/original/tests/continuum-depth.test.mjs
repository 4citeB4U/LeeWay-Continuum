import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleHierarchy,recordedSegments,canopyPositions,canopyPage,FOCUS_PAGE_SIZE} from '../continuum-depth.mjs';
import {sourceCapacitySlots,createGeodesicGeometry} from '../continuum-sphere.mjs';

const r=(recordId,collection='Knowledge',source={},extra={})=>({recordId,collection,title:recordId,storageKind:'INDEX_REFERENCE',source,...extra});
test('92 canonical honeycomb cells are retained; dynamic occupancy uses source counts only',()=>{
 assert.equal(createGeodesicGeometry().cells.length,92);
 assert.equal(sourceCapacitySlots(0),0);
 assert.ok(sourceCapacitySlots(837)>sourceCapacitySlots(20));
 assert.ok(sourceCapacitySlots(24245)>sourceCapacitySlots(837));
 assert.ok(sourceCapacitySlots(1e12)<=18);
});
test('universe -> real collections -> actual Brain parent -> records',()=>{
 const rows=[
  r('skill-a','Source Index',{parentSourceRecordId:'parent-skills',parentLabel:'skills'}),
  r('skill-b','Source Index',{parentSourceRecordId:'parent-skills',parentLabel:'skills'}),
  r('worker','Source Index',{parentSourceRecordId:'parent-work',parentLabel:'work'}),
  r('file','Owner imports',{kind:'OWNER_FILE_IMPORT'}, {kind:'file',storageKind:'RETAINED_ORIGINAL'})
 ];
 const root=visibleHierarchy(rows);
 assert.equal(root.nodes.filter(n=>n.type==='collection').length,2);
 const col=visibleHierarchy(rows,[{type:'collection',value:'Source Index',label:'Source Index'}]);
 assert.equal(col.nodes.filter(n=>n.type==='parent').length,2);
 assert.equal(col.nodes.filter(n=>n.type==='record').length,0);
 const branch=visibleHierarchy(rows,[{type:'collection',value:'Source Index'},{type:'parent',value:'parent-skills',label:'skills'}]);
 assert.deepEqual(branch.nodes.map(n=>n.recordId),['skill-a','skill-b']);
});
test('an indexed source path cannot become a directory of original files',()=>{
 const row=r('entry','Source Index',{recordedRelativePath:'/owner/project/registry.json'});
 assert.deepEqual(recordedSegments(row),[]);
 const rows=visibleHierarchy([row],[{type:'collection',value:'Source Index'}]);
 assert.equal(rows.nodes[0].type,'record');
});
test('owner source-linked paths form real metadata folders recursively',()=>{
 const file={recordId:'owned-one',collection:'Owner imports',kind:'file',title:'manual.txt',storageKind:'RETAINED_ORIGINAL',
  source:{recordedRelativePath:'Work/2026/reports/manual.txt'}};
 assert.deepEqual(recordedSegments(file),['Work','2026','reports']);
 const col=[{type:'collection',value:'Owner imports',label:'Owner imports'}];
 const first=visibleHierarchy([file],col);assert.equal(first.nodes[0].type,'folder');assert.equal(first.nodes[0].label,'Work');
 const one=[...col,{type:'folder',value:'Work',depth:1,label:'Work'}];
 const second=visibleHierarchy([file],one);assert.equal(second.nodes[0].label,'2026');
 const third=visibleHierarchy([file],[...one,{type:'folder',value:'Work/2026',depth:2,label:'2026'}]);assert.equal(third.nodes[0].label,'reports');
 const terminal=visibleHierarchy([file],[...one,{type:'folder',value:'Work/2026',depth:2,label:'2026'}, {type:'folder',value:'Work/2026/reports',depth:3,label:'reports'}]);
 assert.equal(terminal.nodes[0].recordId,'owned-one');
});
test('traversal, unsourced or oversized paths cannot fabricate real directories',()=>{
 for(const path of ['a/../secret.txt','./secret.txt','a'.repeat(1025)]){
  const row={recordId:'x',kind:'file',source:{recordedRelativePath:path}};
  assert.deepEqual(recordedSegments(row),[]);
 }
});
test('unconnected red Work universe has no fictional files',()=>{
 assert.deepEqual(visibleHierarchy([]).nodes,[]);
});
test('every curved cell is bounded on-screen in desktop and phone layouts',()=>{
 for(const mobile of [false,true]){
  const loc=canopyPositions(12,mobile);
  assert.equal(loc.length,FOCUS_PAGE_SIZE);
  for(const p of loc){assert.ok(p.x>=5&&p.x<=95);assert.ok(p.y>=4&&p.y<=96);assert.ok(p.rotateY<=27&&p.rotateY>=-27);}
 }
});
test('12-item pages are backed by received records, not count metadata',()=>{
 const nodes=Array.from({length:40},(_,i)=>({type:'record',recordId:'source-'+i}));
 assert.equal(canopyPage(nodes,0).items.length,12);
 assert.equal(canopyPage(nodes,3).items.length,4);
 assert.equal(canopyPage(nodes,3).hasNext,false);
});
