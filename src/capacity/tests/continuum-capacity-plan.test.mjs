/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.CAPACITY.TEST
TAG: LEEWAY.CONTINUUM.CAPACITY_PROPOSAL_TEST.V1
WHO: LeeWay Industries / owner-authorized development
WHAT: Test bounded, fail-closed, read-only Continuum capacity evaluation.
WHEN: 2026-10-26
WHERE: machine-consciousness/continuum/tests/continuum-capacity-plan.test.mjs
WHY: Capacity pressure must not be confused with privileged auto-provisioning.
HOW: Pure deterministic fixture measurements and adversarial inputs.
AUTHORITY: TEST_ONLY; no real database files or owner identity material.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { planContinuumCapacity } from '../continuum-capacity-plan.mjs';

const cell = {ownerId:'owner-fixture',bodyId:'pc-fixture',cellId:'knowledge',providerId:'canonical',revision:'v1',role:'CANONICAL'};
const policy = {storageHighPercent:80,queueHighCount:100,writeP95HighMs:400,readP95HighMs:300,maxObservationAgeMs:60000};
const nowMs = 1_000_000;
const metrics = {ownerId:cell.ownerId,bodyId:cell.bodyId,cellId:cell.cellId,providerId:cell.providerId,
  revision:cell.revision,observedAtMs:nowMs-1000,storageCapacityBytes:10000,storageUsedBytes:4000,
  queueDepth:1,writeP95Ms:10,readP95Ms:10};
const plan = overrides => planContinuumCapacity({cell,metrics,policy,nowMs,...overrides});

test('healthy observed capacity never asks to provision',()=>{
 const r=plan(); assert.equal(r.state,'WITHIN_OBSERVED_BUDGET'); assert.equal(r.requestedOperation,'NONE');
 assert.equal(r.executionAuthorized,false); assert.deepEqual(r.requires,[]);
});
test('storage high requests sharding proposal but grants no execution',()=>{
 const r=plan({metrics:{...metrics,storageUsedBytes:8000}});
 assert.equal(r.requestedOperation,'PROPOSE_NEW_OWNER_SCOPED_SHARD');
 assert.equal(r.executionAuthorized,false); assert(r.requires.includes('SINGLE_CANONICAL_WRITER'));
});
test('write P95 and queue each trigger capacity investigation',()=>{
 for(const m of [{writeP95Ms:400},{queueDepth:100}]){
  const r=plan({metrics:{...metrics,...m}});
  assert.equal(r.requestedOperation,'PROPOSE_NEW_OWNER_SCOPED_SHARD');
 }
});
test('read latency alone proposes read-only replica, never second writer',()=>{
 const r=plan({metrics:{...metrics,readP95Ms:300}});
 assert.equal(r.requestedOperation,'PROPOSE_READ_REPLICA');
 assert(r.requires.includes('SINGLE_CANONICAL_WRITER'));
});
test('stale observations cannot produce provisioning intent',()=>{
 const r=plan({metrics:{...metrics,storageUsedBytes:9999,observedAtMs:nowMs-60001}});
 assert.equal(r.state,'UNVERIFIED_STALE_OBSERVATION'); assert.equal(r.requestedOperation,'NONE');
});
test('exact policy threshold does not overflow a measured budget',()=>{
 const r=plan({metrics:{...metrics,storageUsedBytes:7999}});
 assert.equal(r.requestedOperation,'NONE');
});
test('mismatched owner, body, revision and provider all fail closed',()=>{
 for(const key of ['ownerId','bodyId','revision','providerId','cellId']){
  assert.throws(()=>plan({metrics:{...metrics,[key]:'other'}}),/SCOPE_MISMATCH/);
 }
});
test('missing and untrusted metrics are rejected',()=>{
 for(const m of [{storageCapacityBytes:0},{storageUsedBytes:10001},{readP95Ms:-2},{queueDepth:NaN},{observedAtMs:nowMs+1}]){
  assert.throws(()=>plan({metrics:{...metrics,...m}}),/OBSERVATION_INVALID/);
 }
});
test('invalid policy is rejected instead of enabling unbounded auto expansion',()=>{
 for(const p of [{storageHighPercent:100},{queueHighCount:0},{maxObservationAgeMs:0}]){
  assert.throws(()=>plan({policy:{...policy,...p}}),/POLICY_INVALID/);
 }
});
test('candidate digest is repeatable; decision carries no live authority',()=>{
 assert.equal(plan().proposalSha256,plan().proposalSha256);
 assert.match(plan().proposalSha256,/^[a-f0-9]{64}$/);
 assert.equal(plan().executionAuthorized,false);
});
