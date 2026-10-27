// LEEWAY HEADER — DO NOT REMOVE
// REGION: LEEWAY.CONTINUUM.PAGES.SOURCE_PARITY
// TAG: LEEWAY.CONTINUUM.PUBLIC_UI_ORIGINAL_BYTES.V1
// WHO: LeeWay Industries
// WHAT: Verify root Pages entry and unchanged original Continuum source blobs.
// WHEN: 2026-10-27
// WHERE: tests/continuum-pages-entry.test.mjs
// WHY: Prevent a passing Pages deployment that fails to show the original widget UI.
// HOW: Inspect exact entry route, linked assets, and original recorded Git blob identities.
// AUTHORITY: SOURCE_TEST_ONLY; no native host, backend or Veritas claim.
// LICENSE: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=p=>readFileSync(resolve(root,p));
const originalBlobs={
  'ui/original/index.html':'682c870dca4f2d42668f462fc068fd56b712881b',
  'ui/original/continuum.css':'8b38dd06dc0eab167527dab30c7cd7162f4ccf8e',
  'ui/original/continuum-app.mjs':'f2d972d9fe8a3f585fc76ba49dc6590926cabbdc',
  'ui/original/continuum-sphere.mjs':'c6da805cc59f0d55d2eb74dcb7a9b3f7e937fc93',
  'ui/original/continuum-depth.mjs':'4844c32b6080df6b1ce9de0fd20397878c887ecf',
  'ui/original/continuum-media.mjs':'628966775ba05df500db1b307fb1915e78d366eb',
  'ui/original/mammoth.browser.min.js':'650e8a68cf239dfbbbd9620e5c4d56baafeb0552',
  'ui/original/purify.min.js':'00742c47118a703f414f6a116ddff07965d8e59e'
};
test('Pages root routes to the original UI without a replacement widget',()=>{
  const entry=load('index.html').toString('utf8');
  assert.match(entry,/url=\.\/ui\/original\/index\.html/);
  assert.match(entry,/location\.replace\(new URL\('\.\/ui\/original\/index\.html'/);
  assert.doesNotMatch(entry,/fetch\s*\(/);
});
test('Original UI includes all its source-local asset references',()=>{
  const html=load('ui/original/index.html').toString('utf8');
  for(const asset of ['continuum.css','continuum-app.mjs','mammoth.browser.min.js','purify.min.js']) {
    assert.ok(html.includes('./'+asset),'missing original HTML link to '+asset);
    assert.ok(existsSync(resolve(root,'ui/original',asset)),'missing original asset '+asset);
  }
});
test('Original Continuum UI files exactly match the source provenance Git blobs',()=>{
  for(const [path,expected] of Object.entries(originalBlobs)) {
    const bytes=load(path);
    const actual=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
    assert.equal(actual,expected,path+' source blob changed');
  }
});
