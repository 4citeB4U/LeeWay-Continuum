/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.GITHUB_FREE_RECOVERY.TEST
TAG: LEEWAY.CONTINUUM.GITHUB.CPU_RECOVERY.NEGATIVE_TESTS.V1
5WH:
WHAT = Exercise original Continuum local-storage handoff and failure controls.
WHY = Qualify ephemeral GitHub runner usage solely for testing and package recovery rehearsal.
WHO = Original Continuum owner; outside support contributor, not Agent Lee.
WHERE = tests/github-free-recovery-ci.test.mjs.
WHEN = 2026-11-21.
HOW = Temporary synthetic content, source/target body readback, tamper and wrong-owner refusal.
LICENSE = MIT.
AUTHORITY = SOURCE_CI_ONLY; NO USER DATA, LIVE APP HOSTING, PRODUCTION RECEIPT OR VERITAS.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareSyntheticGithubRecovery,verifySyntheticGithubRecovery} from
 '../scripts/qualify-github-free-recovery.mjs';
import {createContinuumAccountBinding,planContinuumReconnect} from '../src/identity/continuum-account-binding.mjs';
async function fixture(action){
 const dir=await mkdtemp(join(tmpdir(),'continuum-github-ci-fixture-'));
 try{return await action(dir);}finally{await rm(dir,{recursive:true,force:true});}
}
test('two body scopes preserve exact bytes via original Continuum local storage API',async()=>{
 await fixture(async dir=>{
  const s=await prepareSyntheticGithubRecovery(dir);
  const t=await verifySyntheticGithubRecovery(dir);
  assert.equal(s.stage,'SOURCE_JOB_PREPARED');
  assert.equal(t.stage,'TARGET_JOB_RESTORED');
  assert.equal(s.fileSha256,t.fileSha256);
  assert.equal(s.sourceBytes,t.targetBytes);
  assert.equal(t.separateBodyScopeVerified,true);
  assert.equal(t.foreignOwnerDenied,true);
  assert.equal(s.sourcePlatform,'ANDROID');
  assert.equal(t.targetPlatform,'IOS');
  assert.equal(t.nativeAppleDigitalBrainCopied,false);
  assert.equal(t.nativeDeviceConnectionEstablished,false);
  assert.equal(t.githubUsedAsOnlineBackend,false);
  assert.equal(t.canonicalReceiptIssued,false);
  assert.equal(t.privateOwnerPayloadHandled,false);
  assert.equal(t.actualUserDevice,false);
  assert.equal(t.physicalPcieTransferExecuted,false);
 });
});
test('artifact payload mutation is refused before any target write',async()=>{
 await fixture(async dir=>{
  await prepareSyntheticGithubRecovery(dir);
  const bad=new Uint8Array(await readFile(join(dir,'fixture.bin')));
  bad[1]^=0xff;
  await writeFile(join(dir,'fixture.bin'),bad);
  await assert.rejects(verifySyntheticGithubRecovery(dir),/CONTINUUM_GITHUB_CI_ARTIFACT_INTEGRITY_INVALID/);
 });
});
test('source manifest attempting to claim live hosting or real owner state is denied',async()=>{
 await fixture(async dir=>{
  await prepareSyntheticGithubRecovery(dir);
  const p=join(dir,'manifest.json'),m=JSON.parse(await readFile(p,'utf8'));
  m.executableServiceDeployed=true;
  await writeFile(p,JSON.stringify(m));
  await assert.rejects(verifySyntheticGithubRecovery(dir),/CONTINUUM_GITHUB_CI_MANIFEST_INVALID/);
 });
});
test('source manifest tampered tenant/body scope is denied',async()=>{
 await fixture(async dir=>{
  await prepareSyntheticGithubRecovery(dir);
  const p=join(dir,'manifest.json'),m=JSON.parse(await readFile(p,'utf8'));
  m.targetBodyId='unauthorized-target';
  await writeFile(p,JSON.stringify(m));
  await assert.rejects(verifySyntheticGithubRecovery(dir),/CONTINUUM_GITHUB_CI_MANIFEST_INVALID/);
 });
});
test('public test fixture is marked synthetic, not a Continuum database or production release',async()=>{
 await fixture(async dir=>{
  const s=await prepareSyntheticGithubRecovery(dir);
  const m=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
  assert.equal(m.classification,'PUBLIC_SYNTHETIC_FIXTURE_ONLY');
  assert.equal(m.githubStorageRole,'CI_TRANSIENT_ARTIFACT_NOT_CONTINUUM');
  assert.equal(m.authorityRef,'leeway.continuum');
  assert.equal(m.ownerRecordIssued,false);
  assert.equal(m.executableServiceDeployed,false);
  assert.equal(s.productionQualified,false);
  assert.equal(s.persistentCpuServerProvided,false);
 });
});

test('original OIDC account binding keeps owner across Android and iPhone but each has a distinct body',()=>{
 const account={identityVerified:true,issuer:'https://identity-fixture.invalid',subject:'public-ci-fixture-owner'};
 const android=createContinuumAccountBinding({account,bodyId:'ci-android-body'});
 const iphone=createContinuumAccountBinding({account,bodyId:'ci-apple-body'});
 assert.equal(android.ownerId,iphone.ownerId);
 assert.notEqual(android.bodyId,iphone.bodyId);
 assert.equal(planContinuumReconnect({account,bodyId:iphone.bodyId}).state,
  'CONTINUUM_RECONNECT_PENDING_CANONICAL_READBACK');
 assert.equal(planContinuumReconnect({account,bodyId:iphone.bodyId}).privateDataRead,false);
 const other=createContinuumAccountBinding({account:{...account,subject:'different-user'},
  bodyId:iphone.bodyId});
 assert.notEqual(other.ownerId,iphone.ownerId);
 assert.throws(()=>planContinuumReconnect({account:{...account,subject:'different-user'},
  bodyId:iphone.bodyId,localBinding:android}),/CONTINUUM_LOCAL_CUSTODY_ACCOUNT_MISMATCH/);
});
test('Android-to-iOS Continuum test never copies native Digital Brain or claims actual device execution',async()=>{
 await fixture(async dir=>{
  await prepareSyntheticGithubRecovery(dir);
  const m=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
  assert.equal(m.sourcePlatform,'ANDROID');
  assert.equal(m.targetPlatform,'IOS');
  assert.equal(m.portablePayloadRole,'OWNER_SCOPED_CONTINUUM_CONTENT_ONLY');
  assert.equal(m.sourceDigitalBrain,'RETAIN_LOCAL_DEVICE_BOUND');
  assert.equal(m.targetDigitalBrain,'MUST_CREATE_SEPARATE_NATIVE_BINDING');
  assert.equal(m.authenticationFixture,'SYNTHETIC_OIDC_NOT_REAL_LOGIN');
  const altered={...m,targetPlatform:'WINDOWS'};
  await writeFile(join(dir,'manifest.json'),JSON.stringify(altered));
  await assert.rejects(verifySyntheticGithubRecovery(dir),/CONTINUUM_GITHUB_CI_MANIFEST_INVALID/);
 });
});
