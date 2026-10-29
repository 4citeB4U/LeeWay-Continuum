// LEEWAY HEADER — DO NOT REMOVE
// REGION: LEEWAY.CONTINUUM.TEST.STORAGE_READINESS
// TAG: LEEWAY.CONTINUUM.STORAGE_READINESS_TEST.V1
// WHO: LeeWay Industries / Creator-authorized engineering
// WHAT: Source negative-case storage readiness verification.
// WHEN: 2026-10-28
// WHERE: tests/continuum-storage-readiness.test.mjs
// WHY: Prevent adapter registration from pretending real durable storage exists.
// HOW: Fixture probes of scoped resources and original readback; no live provider touched.
// AUTHORITY: TEST_ONLY.
// LICENSE: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateContinuumStorageReadiness} from '../src/integration/storage-readiness.mjs';
const ownerId='owner-fixture',bodyId='body-fixture';
const registry=[{ownerId,bodyId,resourceId:'canonical-sqlite',kind:'sqlite',role:'CANONICAL',cells:['runtime-state','evidence-vault','memory','learning']}];
const healthy=async ({resourceId,kind})=>({healthy:true,ownerId,bodyId,resourceId,kind,revision:'v1',readbackVerified:true,originalRuntimeBound:true});
test('no registered storage is not production ready',async()=>{
 const result=await evaluateContinuumStorageReadiness({ownerId,bodyId,registry:[],probe:healthy});
 assert.equal(result.basicReadiness,'BLOCKED');assert.equal(result.productionAccepted,false);
});
test('canonical source-level readback is distinct from production qualification',async()=>{
 const result=await evaluateContinuumStorageReadiness({ownerId,bodyId,registry,probe:healthy});
 assert.equal(result.basicReadiness,'SOURCE_PROBE_OBSERVED');
 assert.equal(result.cells.length,4);assert.equal(result.productionAccepted,false);
 assert.equal(result.independentVeritas,'NOT_EXECUTED');
});
test('missing real readback blocks all logical cells',async()=>{
 const result=await evaluateContinuumStorageReadiness({ownerId,bodyId,registry,probe:async()=>({healthy:true})});
 assert.equal(result.basicReadiness,'BLOCKED');
 assert(result.cells.every(c=>c.state!=='RESOURCE_READBACK_OBSERVED'));
});
test('cross-owner registry is refused',async()=>{
 await assert.rejects(evaluateContinuumStorageReadiness({ownerId,bodyId,registry:[{...registry[0],ownerId:'other'}],probe:healthy}),/REGISTRY_INVALID/);
});
test('duplicate identifiers and wrong role refused',async()=>{
 await assert.rejects(evaluateContinuumStorageReadiness({ownerId,bodyId,registry:[registry[0],registry[0]],probe:healthy}),/REGISTRY_INVALID/);
 await assert.rejects(evaluateContinuumStorageReadiness({ownerId,bodyId,registry:[{...registry[0],role:'DERIVED_ANALYTICS'}],probe:healthy}),/REGISTRY_INVALID/);
});
test('probe outage remains unverified',async()=>{
 const result=await evaluateContinuumStorageReadiness({ownerId,bodyId,registry,probe:async()=>{throw Error('offline');}});
 assert.equal(result.basicReadiness,'BLOCKED');
});
test('same cell assigned to multiple live resources is ambiguous',async()=>{
 const a={...registry[0],cells:['memory']};
 const b={...registry[0],resourceId:'canonical-sqlite-2',cells:['memory']};
 const result=await evaluateContinuumStorageReadiness({ownerId,bodyId,registry:[a,b],probe:healthy});
 assert.equal(result.cells.find(x=>x.cellId==='memory').state,'RESOURCE_UNVERIFIED_OR_AMBIGUOUS');
});
