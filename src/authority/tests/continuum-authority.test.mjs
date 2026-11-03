import test from 'node:test';
import assert from 'node:assert/strict';
import {assertContinuumAuthorityRef,assertContinuumScope,continuumAuthorityDescriptor} from '../continuum-authority.mjs';

test('Continuum authority is deployment-independent and distinct from scope',()=>{
  assert.equal(assertContinuumAuthorityRef('leeway.continuum'),'leeway.continuum');
  assert.deepEqual(assertContinuumScope({ownerId:'owner-1',bodyId:'pc-primary'}),{
    ownerId:'owner-1',bodyId:'pc-primary',scopeKind:'OWNER_BODY_SCOPE'
  });
  assert.deepEqual(continuumAuthorityDescriptor({ownerId:'owner-1',bodyId:'pc-primary',resourceId:'sqlite-main'}),{
    authorityRef:'leeway.continuum',authorityMode:'DEPLOYMENT_INDEPENDENT_LOGICAL_AUTHORITY',
    ownerId:'owner-1',bodyId:'pc-primary',scopeKind:'OWNER_BODY_SCOPE',resourceId:'sqlite-main'
  });
});

test('device, OS and repository labels cannot become Continuum authority',()=>{
  for (const value of ['pc-primary','phone-fold6','windows','android','github','sqlite-main']) {
    assert.throws(()=>assertContinuumAuthorityRef(value),/AUTHORITY_REF_INVALID/);
  }
  assert.doesNotThrow(()=>assertContinuumScope({ownerId:'github',bodyId:'pc-primary'}));
});
