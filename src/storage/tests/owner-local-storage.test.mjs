/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.LOCAL.TEST
TAG: LEEWAY.CONTINUUM.OWNER_LOCAL_STORAGE_TEST.V1
WHO: LeeWay Industries / Creator-authorized engineering
WHAT: Real filesystem readback, restart, scope denial and corruption tests.
WHEN: 2026-11-03
WHERE: src/storage/tests/owner-local-storage.test.mjs
WHY: Prove source-level local storage without claiming owner's host is accessed.
HOW: Node temporary filesystem and negative test cases.
AUTHORITY: TEST_ONLY.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openOwnerLocalStorage} from '../owner-local-storage.mjs';
test('real sandbox disk roundtrip, owner separation, reopen and corruption denial',async()=>{
 const root=await mkdtemp(join(tmpdir(),'continuum-owner-'));
 const context={ownerId:'owner-one',bodyId:'body-one',capabilities:['continuum.read','continuum.write']};
 try{
  const make=()=>openOwnerLocalStorage({root,ownerId:'owner-one',bodyId:'body-one',authorize:async()=>true});
  const store=await make(),data=new Uint8Array([0,1,2,255,3,1]);
  const saved=await store.put(data,context);
  assert.equal(saved.readbackVerified,true);
  const reopened=await make();
  assert.deepEqual((await reopened.get(saved.contentSha256,context)).bytes,data);
  await assert.rejects(reopened.get(saved.contentSha256,{...context,ownerId:'intruder'}),{code:'CONTINUUM_LOCAL_ACCESS_DENIED'});
  await assert.rejects(reopened.put(data,{...context,capabilities:['continuum.read']}),{code:'CONTINUUM_LOCAL_ACCESS_DENIED'});
  await writeFile(join(root,store.descriptor.ownerScope,saved.contentSha256.slice(0,2),saved.contentSha256),new Uint8Array([9]));
  await assert.rejects(reopened.get(saved.contentSha256,context),{code:'CONTINUUM_LOCAL_READBACK_MISMATCH'});
 }finally{await rm(root,{recursive:true,force:true});}
});
