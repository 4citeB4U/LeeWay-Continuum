import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createGeodesicGeometry,normalizeSphereData,UNIVERSES,sourceCapacitySlots} from '../continuum-sphere.mjs';
import {visibleHierarchy,canopyPositions,canopyPage} from '../continuum-depth.mjs';

const dir=path.dirname(fileURLToPath(import.meta.url));
const read=name=>fs.readFileSync(path.join(dir,'..',name),'utf8');

test('Continuum preserves sphere-only startup and independently collapsible left navigation',()=>{
 const h=read('index.html'),app=read('continuum-app.mjs');
 assert.match(h,/<main id="workspace" class="sidebar-collapsed">/);
 assert.match(h,/id="sidebar-toggle"[^>]+aria-expanded="false"/);
 assert.match(h,/id="continuum-sidebar"[^>]+inert/);
 assert.match(app,/function setSidebarOpen\(open\)/);
});
test('curved translucent universe selection, rather than an old flat focus grid',()=>{
 const h=read('index.html'),css=read('continuum.css');
 assert.match(h,/id="canopy-viewport"/);
 assert.match(h,/id="canopy-ancestors"/);
 assert.match(css,/\.canopy-viewport\{[\s\S]*?perspective:1050px/);
 assert.match(css,/\.canopy-hex\{[\s\S]*?clip-path:polygon/);
 assert.match(css,/#workspace\.viewer-open \.canopy-hex/);
});
test('nested cells follow real collection and parent identities',()=>{
 const app=read('continuum-app.mjs');
 assert.match(app,/visibleHierarchy\(state\.records,state\.focusPath\)/);
 assert.match(app,/state\.focusPath\.push/);
 assert.match(app,/node\.type==='record'/);
 const rows=[{recordId:'known',collection:'Records',title:'One',source:{parentSourceRecordId:'parent-1',parentLabel:'Skills'},storageKind:'INDEX_REFERENCE'}];
 const root=visibleHierarchy(rows);
 assert.equal(root.nodes[0].type,'collection');
 assert.equal(visibleHierarchy(rows,[{type:'collection',value:'Records'}]).nodes[0].type,'parent');
});
test('owner records are used, not substituted from metadata counts or synthetic examples',()=>{
 const nodes=normalizeSphereData({universes:[{id:'knowledge',count:830,items:[]}]});
 assert.equal(nodes.get('knowledge').items.length,0);
 assert.equal(canopyPage([],0).items.length,0);
 const app=read('continuum-app.mjs');
 assert.match(app,/No files or directories are invented/);
});
test('92 source-derived sphere cells and real count growth preserve identity',()=>{
 assert.equal(createGeodesicGeometry().cells.length,92);
 assert.equal(UNIVERSES.length,13);
 assert.equal(sourceCapacitySlots(0),0);
 assert.ok(sourceCapacitySlots(10000)>sourceCapacitySlots(10));
 assert.equal(canopyPositions(12,false).length,12);
});
test('content access still uses the original stored-byte integrity check',()=>{
 const app=read('continuum-app.mjs');
 assert.match(app,/CONTENT_LENGTH_MISMATCH/);
 assert.match(app,/CONTENT_HASH_MISMATCH/);
 assert.match(app,/createContinuumMediaViewer/);
 assert.match(app,/previewStoredRecord/);
});
test('media is confined to same-origin hash-backed blobs with local DOCX sanitizer',()=>{
 const m=read('continuum-media.mjs'),h=read('index.html');
 assert.match(m,/URL\.createObjectURL/);
 assert.match(m,/globalThis\.DOMPurify\.sanitize/);
 assert.match(m,/globalThis\.mammoth\.convertToHtml/);
 assert.match(h,/\.\/mammoth\.browser\.min\.js/);
 assert.match(h,/\.\/purify\.min\.js/);
});
test('mobile layout retains the same focus hierarchy and file honeycomb',()=>{
 const css=read('continuum.css'),app=read('continuum-app.mjs');
 assert.match(css,/@media\s*\(max-width:600px\)/);
 assert.match(css,/#workspace \.inspector\.file-honeycomb/);
 assert.match(app,/matchMedia\('\(max-width:600px\)'\)/);
 assert.match(app,/focusMotion\(\)/);
});
