import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const html=readFileSync(resolve(root,'ui/original/index.html'),'utf8');
const module=readFileSync(resolve(root,'ui/original/continuum-storage-onboarding.mjs'),'utf8');

test('one-screen storage onboarding is present without replacing the original UI',()=>{
  assert.match(html,/id="connect-storage"/);
  assert.match(html,/id="storage-onboarding"/);
  assert.match(html,/continuum-storage-onboarding\.mjs/);
  for(const provider of ['local-continuum','google-drive','mega','pcloud'])assert.match(html,new RegExp(`data-provider="${provider}"`));
});

test('onboarding delegates only provider identity to the approved host bridge',()=>{
  assert.match(module,/startStorageOnboarding/);
  assert.match(module,/Object\.freeze\(\{providerId\}\)/);
  assert.doesNotMatch(module,/startStorageOnboarding\([^)]*(password|accessToken|refreshToken|clientSecret)/i);
  assert.match(module,/UNTRUSTED_ONBOARDING_REDIRECT/);
});
