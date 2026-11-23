/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.GITHUB_RECOVERY_HANDOFF.TEST
TAG: LEEWAY.CONTINUUM.OWNER_GITHUB_RECOVERY_SECURITY_TESTS.V1
5WH:
WHAT = Qualify original Continuum, exact Formula recovery, encrypted GitHub release readback and cross-owner denial.
WHY = A customer-owned GitHub project is a recovery anchor, not Continuum's database or unverified plain-text backup.
WHO = Outside GPT-6 contributor; synthetic fixtures are not live Formula, Veritas or Receipt providers.
WHERE = src/integration/tests/github-project-recovery-handoff.test.mjs.
WHEN = 2026-11-23.
HOW = Node tests with injected original-host mocks; no provider, token, key or external service accessed.
LICENSE = Existing repository terms.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createContinuumGithubRecoveryHandoff}
 from '../github-project-recovery-handoff.mjs';
import {deriveContinuumOwnerScope} from '../../identity/continuum-account-binding.mjs';

const account={identityVerified:true,issuer:'https://issuer.example.test',subject:'customer-321'};
const ownerId=deriveContinuumOwnerScope(account);
const hash=v=>createHash('sha256').update(v).digest('hex');
const encrypted=new Uint8Array(Buffer.from('TEST-ONLY-CIPHERTEXT-NOT-A-REAL-USER-BACKUP'));
const originalHash=hash(Buffer.from('test-only canonical content'));

const request={sessionRef:'original-session-01',bodyId:'body-android-01',
 projectRef:'project:customer-01',repositoryFullName:'customer-a/leeway-project-01',
 ownerGitHubLogin:'customer-a',workId:'job:checkpoint-001'};
function fixture(overrides={}){
 const seen=[];
 const bindings={
  authenticateOwner:async x=>{seen.push('authenticate');return account},
  approveCheckpoint:async x=>{seen.push('approve');return {
    state:'ORIGINAL_CONTINUUM_CHECKPOINT_APPROVED',
    authorityRef:'leeway.continuum',ownerId,projectRef:request.projectRef,
    repositoryFullName:request.repositoryFullName,grantRef:'grant:checkpoint-01'
  }},
  prepareCanonicalCheckpoint:async x=>{seen.push('continuum');return {
    authorityRef:'leeway.continuum',ownerId,projectRef:request.projectRef,
    formula:{representation:'EXACT_LOSSLESS',reconstructionVerified:true,
      originalSha256:originalHash},
    encryption:{algorithm:'AES-256-GCM',ownerScope:ownerId,verified:true},
    encryptedBytes:encrypted,ciphertextSha256:hash(encrypted)
  }},
  publishApprovedRelease:async x=>{seen.push('publish');
    assert.equal(x.purpose,'OWNER_DISASTER_RECOVERY_CHECKPOINT_NOT_LIVE_DATABASE');
    assert.equal(x.repositoryFullName,request.repositoryFullName);
    assert.equal(hash(x.encryptedBytes),hash(encrypted));
    assert.notEqual(Buffer.from(x.encryptedBytes).toString(), 'test-only canonical content');
    return {releaseRef:'release:customer-20261123',ownerId,projectRef:request.projectRef,
      repositoryFullName:request.repositoryFullName};
  },
  readbackApprovedRelease:async x=>{seen.push('readback');return {encryptedBytes:encrypted}}
 };
 return {handoff:createContinuumGithubRecoveryHandoff({...bindings,...overrides}),seen};
}
test('one governed, exact and encrypted recovery checkpoint can be read back without turning GitHub into the database',async()=>{
 const {handoff,seen}=fixture();
 const res=await handoff.checkpoint(request);
 assert.equal(handoff.authorityRef,'leeway.continuum');
 assert.equal(handoff.continuouslyWritesToGitHub,false);
 assert.equal(handoff.actsAsCanonicalDatabase,false);
 assert.equal(res.state,'OWNER_GITHUB_ENCRYPTED_RECOVERY_READBACK_MATCH');
 assert.equal(res.originalContinuumUsed,true);
 assert.equal(res.formulaMode,'EXACT_LOSSLESS_VERIFIED');
 assert.equal(res.ciphertextSha256,hash(encrypted));
 assert.equal(res.repositoryFullName,request.repositoryFullName);
 assert.equal(res.productionQualified,false);
 assert.equal(res.recoveryKeyIndependence,'NOT_PROVEN_BY_THIS_HANDOFF');
 assert.deepEqual(seen,['authenticate','approve','continuum','publish','readback']);
 assert.deepEqual(res.storageCompartments,['runtime-state','evidence-vault','memory','learning']);
});
test('untrusted repositories and cross-owner resources fail before a source write',async()=>{
 const {handoff,seen}=fixture();
 await assert.rejects(handoff.checkpoint({...request,repositoryFullName:'creator-account/project'}),/CROSS_OWNER_DENIED/);
 await assert.rejects(handoff.checkpoint({...request,repositoryFullName:'https://github.com/customer-a/repo'}),/REPOSITORY_INVALID/);
 await assert.rejects(handoff.checkpoint({...request,repositoryFullName:'customer-a/private-repo?token=x'}),/REPOSITORY_INVALID/);
 assert.deepEqual(seen,[]);
});
test('canonical Continuum checkpoint grant cannot be forged by another owner or authority',async()=>{
 const {handoff,seen}=fixture({approveCheckpoint:async()=>({
  state:'ORIGINAL_CONTINUUM_CHECKPOINT_APPROVED',ownerId:'somebody-else',
  authorityRef:'github',projectRef:request.projectRef,
  repositoryFullName:request.repositoryFullName,grantRef:'grant:untrusted'
 })});
 await assert.rejects(handoff.checkpoint(request),/ORIGINAL_GRANT_REQUIRED/);
 assert.deepEqual(seen,['authenticate']);
});
test('lossy Formula projection, invalid encryption or unqualified SHA never becomes recovery',async()=>{
 const scenarios=[
  {formula:{representation:'CONDENSED_SUMMARY',reconstructionVerified:true,originalSha256:originalHash}},
  {formula:{representation:'EXACT_LOSSLESS',reconstructionVerified:false,originalSha256:originalHash}},
  {encryption:{algorithm:'PLAINTEXT',ownerScope:ownerId,verified:true}},
  {encryption:{algorithm:'AES-256-GCM',ownerScope:'wrong-owner',verified:true}},
  {encryptedBytes:new Uint8Array(Buffer.from('bad')),ciphertextSha256:hash(encrypted)}
 ];
 for(const problem of scenarios){
  let published=false;
  const {handoff}=fixture({
   prepareCanonicalCheckpoint:async()=>({
    authorityRef:'leeway.continuum',ownerId,projectRef:request.projectRef,
    formula:{representation:'EXACT_LOSSLESS',reconstructionVerified:true,originalSha256:originalHash},
    encryption:{algorithm:'AES-256-GCM',ownerScope:ownerId,verified:true},
    encryptedBytes:encrypted,ciphertextSha256:hash(encrypted),...problem
   }),
   publishApprovedRelease:async()=>{published=true;throw Error('MUST_NOT_PUBLISH')}
  });
  await assert.rejects(handoff.checkpoint(request),/EXACT_ENCRYPTED_CHECKPOINT_REQUIRED/);
  assert.equal(published,false);
 }
});
test('remote corruption or missing independent readback fails closed',async()=>{
 for(const remote of [{encryptedBytes:new Uint8Array(Buffer.from('corrupt'))},null,
  {encryptedBytes:new Uint8Array()}]){
  const {handoff}=fixture({readbackApprovedRelease:async()=>remote});
  await assert.rejects(handoff.checkpoint(request),/GITHUB_READBACK_MISMATCH/);
 }
});
test('without original host-injected providers there is no recovery or credential path',()=>{
 assert.throws(()=>createContinuumGithubRecoveryHandoff({}),/ORIGINAL_HOST_BINDINGS_REQUIRED/);
});
