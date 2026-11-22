/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.INTEGRATION.REJOIN_TEST
TAG: LEEWAY.CONTINUUM.ORIGINAL_PROVIDER.NATIVE_HANDOFF_TEST.V1
5WH:
WHAT = Exercise original Continuum-to-device integration using source code, storage and enforced negative boundaries.
WHY = Confirm an actual executable cross-device restore seam instead of only an Actions artifact handoff.
WHO = Original owner and review-scoped external contributor, not Agent Lee.
WHERE = src/integration/tests/device-rejoin-handoff.test.mjs.
WHEN = 2026-11-21.
HOW = Original Continuum owner-account binding, host-bound provider, original storage API and injected native callbacks.
LICENSE = MIT.
AUTHORITY = SOURCE_TEST_WITH_TEMPORARY_PROVIDER. No real OIDC, physical phone, live Agent Lee audio, Veritas or Receipt.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createContinuumDeviceRejoinHandoff} from '../device-rejoin-handoff.mjs';
import {createContinuumAccountBinding} from '../../identity/continuum-account-binding.mjs';
import {bindExistingCanonicalContinuum} from '../canonical-host-binding.mjs';
import {openOwnerLocalStorage} from '../../storage/owner-local-storage.mjs';
import {CONTINUUM_AUTHORITY_REF} from '../../authority/continuum-authority.mjs';

const fixtureAccount={identityVerified:true,issuer:'https://identity-fixture.invalid',subject:'rejoin-example-01'};
const sourceBodyId='android-source-01',targetBodyId='ios-target-01';
const ownerId=createContinuumAccountBinding({account:fixtureAccount,bodyId:sourceBodyId}).ownerId;
const bytes=Buffer.from('Public synthetic portable Continuum content: not an Android hardware-brain image.');
const sha=b=>createHash('sha256').update(b).digest('hex');
const recordId='portable-record-01',deviceId='iphone-device-01',workId='original-runtime-work-01';
const sourceSha256=sha(bytes),leaseRef='existing-runtime-lease-01';
const request=Object.freeze({sessionRef:'host-session-ref-01',deviceId,bodyId:targetBodyId,
 platform:'ios',recordId,workId});

async function sandbox(run){
 const dir=await mkdtemp(join(tmpdir(),'leeway-rejoin-original-'));
 try{
  const original=bindExistingCanonicalContinuum({ownerId,bodyId:sourceBodyId,sourceSha256:'a'.repeat(64),
   authorize:async()=>true,
   service:{
    status:async()=>({ownerId,bodyId:sourceBodyId,initialized:true,writeExecutorBound:true,writeAdmissionBound:true}),
    getContent:async()=>({bytes:new Uint8Array(bytes),record:{contentSha256:sourceSha256}}),
    ingestFile:async()=>({recordId})
   }});
  const target=await openOwnerLocalStorage({root:join(dir,'target-device-storage'),ownerId,bodyId:targetBodyId,
   authorize:async({ownerId:o,bodyId:b})=>o===ownerId&&b===targetBodyId});
  const callbacks={
   authenticateOwner:async()=>({...fixtureAccount}),
   enrollDevice:async()=>({state:'ORIGINAL_DEVICE_BRIDGE_ENROLLED',
    ownerId,bodyId:targetBodyId,deviceId,platform:'ios',identityVerified:true}),
   authorizeRestore:async()=>({state:'ORIGINAL_RUNTIME_RESTORE_GRANTED',ownerId,workId,deviceId,
    leaseRef,fencingEpoch:3}),
   resolveOriginalContinuum:async()=>({authorityRef:CONTINUUM_AUTHORITY_REF,ownerId,
    bodyId:sourceBodyId,sourceSha256:'a'.repeat(64),provider:original}),
   stageDeviceContent:async({bytes:b,contentSha256,bodyId})=>{
    const stored=await target.put(b,{ownerId,bodyId,capabilities:['continuum.write']});
    assert.equal(stored.contentSha256,contentSha256);
    return {state:'ORIGINAL_DEVICE_BRIDGE_STAGE_ACCEPTED',ownerId,bodyId,deviceId,
     workId,contentSha256,transferRef:'original-device-bridge-transfer-01'};
   },
   readbackDeviceContent:async({contentSha256,bodyId})=>{
    const result=await target.get(contentSha256,{ownerId,bodyId,capabilities:['continuum.read']});
    return {bytes:result.bytes,ownerId,deviceId,bodyId,workId};
   }
  };
  return await run({callbacks,request,target,original});
 }finally{await rm(dir,{recursive:true,force:true});}
}
test('real original modules integrate canonical provider read + separate device storage readback',async()=>{
 await sandbox(async({callbacks})=>{
  const api=createContinuumDeviceRejoinHandoff(callbacks);
  const result=await api.restoreOne(request);
  assert.equal(api.createsCanonicalStorage,false);
  assert.equal(result.state,'ORIGINAL_PROVIDER_TO_ENROLLED_DEVICE_READBACK_MATCH');
  assert.equal(result.ownerId,ownerId);
  assert.notEqual(result.sourceBodyId,result.targetBodyId);
  assert.equal(result.sourceSha256,sourceSha256);
  assert.equal(result.restoredBytes,bytes.length);
  assert.equal(result.originalContinuumProviderUsed,true);
  assert.equal(result.digitalBrainHardwareStateCopied,false);
  assert.equal(result.originalVeritas,'NOT_PROBED');
  assert.equal(result.canonicalReceipt,'NOT_CREATED');
  assert.equal(result.productionQualified,false);
 });
});
test('native work is not attempted with caller supplied account or denied authentic host login',async()=>{
 await sandbox(async({callbacks})=>{
  let enrolled=false;
  const api=createContinuumDeviceRejoinHandoff({...callbacks,authenticateOwner:async()=>({identityVerified:false,issuer:'https://bad.test',subject:'other-user'}),
   enrollDevice:async()=>{enrolled=true;return callbacks.enrollDevice();}});
  await assert.rejects(api.restoreOne({...request,ownerId:'forged-owner'}),/CONTINUUM_VERIFIED_ACCOUNT_REQUIRED/);
  assert.equal(enrolled,false);
 });
});
test('wrong native device passport rejects before any CPU/Continuum write',async()=>{
 await sandbox(async({callbacks})=>{
  let staged=false;
  const api=createContinuumDeviceRejoinHandoff({...callbacks,
   enrollDevice:async()=>({...await callbacks.enrollDevice(),bodyId:'other-body'}),
   stageDeviceContent:async()=>{staged=true;}});
  await assert.rejects(api.restoreOne(request),/CONTINUUM_REJOIN_NATIVE_ENROLLMENT_UNVERIFIED/);
  assert.equal(staged,false);
 });
});
test('missing or stale original Runtime lease/fencing refuses before native stage',async()=>{
 await sandbox(async({callbacks})=>{
  let staged=false;
  const api=createContinuumDeviceRejoinHandoff({...callbacks,
   authorizeRestore:async()=>({...await callbacks.authorizeRestore(),fencingEpoch:0}),
   stageDeviceContent:async()=>{staged=true;}});
  await assert.rejects(api.restoreOne(request),/CONTINUUM_REJOIN_RUNTIME_GRANT_UNVERIFIED/);
  assert.equal(staged,false);
 });
});
test('unbound original Continuum is rejected rather than replaced with a second writer',async()=>{
 await sandbox(async({callbacks})=>{
  const api=createContinuumDeviceRejoinHandoff({...callbacks,resolveOriginalContinuum:async()=>({})});
  await assert.rejects(api.restoreOne(request),/CONTINUUM_REJOIN_ORIGINAL_PROVIDER_REQUIRED/);
 });
});
test('incorrect bytes from original provider fail integrity before target staging',async()=>{
 await sandbox(async({callbacks})=>{
  let staged=false;
  const api=createContinuumDeviceRejoinHandoff({...callbacks,
   resolveOriginalContinuum:async()=>({authorityRef:CONTINUUM_AUTHORITY_REF,
    ownerId,bodyId:sourceBodyId,sourceSha256:'a'.repeat(64),provider:{
     getContent:async()=>({bytes:new Uint8Array([1,2,3]),record:{contentSha256:sourceSha256}})
    }}),
   stageDeviceContent:async()=>{staged=true;}});
  await assert.rejects(api.restoreOne(request),/CONTINUUM_REJOIN_SOURCE_READBACK_INVALID/);
  assert.equal(staged,false);
 });
});
test('failed target readback preserves reconciliation state rather than reporting successful restore',async()=>{
 await sandbox(async({callbacks})=>{
  const api=createContinuumDeviceRejoinHandoff({...callbacks,
   readbackDeviceContent:async()=>({bytes:new Uint8Array([99]),ownerId,bodyId:targetBodyId,deviceId,workId})});
  await assert.rejects(api.restoreOne(request),/CONTINUUM_REJOIN_TARGET_RECONCILIATION_REQUIRED/);
 });
});
test('native stage denial returns reconciliation requirement, never an invented receipt',async()=>{
 await sandbox(async({callbacks})=>{
  const api=createContinuumDeviceRejoinHandoff({...callbacks,
   stageDeviceContent:async()=>({state:'DENIED'})});
  await assert.rejects(api.restoreOne(request),/CONTINUUM_REJOIN_DEVICE_STAGE_RECONCILIATION_REQUIRED/);
 });
});
test('invalid native platform or missing original provider callbacks fail closed',async()=>{
 assert.throws(()=>createContinuumDeviceRejoinHandoff({
  authenticateOwner:async()=>true}),/CONTINUUM_REJOIN_ORIGINAL_HOST_BINDINGS_REQUIRED/);
 await sandbox(async({callbacks})=>{
  const api=createContinuumDeviceRejoinHandoff(callbacks);
  await assert.rejects(api.restoreOne({...request,platform:'any'}),/CONTINUUM_REJOIN_REQUEST_INVALID/);
 });
});
