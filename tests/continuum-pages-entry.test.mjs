// LEEWAY HEADER — DO NOT REMOVE
// REGION: LEEWAY.CONTINUUM.PAGES.SOURCE_PARITY
// TAG: LEEWAY.CONTINUUM.PUBLIC_UI_ORIGINAL_BYTES.V1
// WHO: LeeWay Industries
// WHAT: Verify root Pages entry and unchanged original Continuum source blobs.
// WHEN: 2026-10-27
// WHERE: tests/continuum-pages-entry.test.mjs
// WHY: Prevent Pages success from masking missing UI assets or changed original source.
// HOW: Check entry route, linked assets, and exact committed Git blob identities.
// AUTHORITY: SOURCE_TEST_ONLY; not a native host, backend, or Veritas test.
// LICENSE: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
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
  for(const asset of ['continuum.css','continuum-app.mjs','mammoth.browser.min.js','purify.min.js']){
    assert.ok(html.includes('./'+asset),'missing HTML reference '+asset);
    assert.ok(existsSync(resolve(root,'ui/original',asset)),'missing original asset '+asset);
  }
});

test('Committed original UI Git blobs match source provenance on every platform',()=>{
  for(const [path,expected] of Object.entries(originalBlobs)){
    assert.ok(existsSync(resolve(root,path)),path+' missing from worktree');
    // Check the committed object to avoid Git's LF/CRLF checkout conversion on Windows.
    const actual=execFileSync('git',['rev-parse','HEAD:'+path],{cwd:root,encoding:'utf8'}).trim();
    assert.equal(actual,expected,path+' committed source blob changed');
  }
});
