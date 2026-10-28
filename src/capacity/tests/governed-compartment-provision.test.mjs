/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.PROVISION.TEST
TAG: LEEWAY.CONTINUUM.GOVERNED_COMPARTMENT_PROVISION_TEST.V1
WHO: LeeWay Industries / Creator-authorized engineering
WHAT: Validate trusted compartment orchestration ordering and fail-closed negative cases.
WHY: No owner-space creation without independent pre/post, readback and canonical receipt.
WHERE: src/capacity/tests/governed-compartment-provision.test.mjs
WHEN: 2026-10-28
HOW: Instrumented fake providers; tests do not qualify real provider identity or live host.
AUTHORITY: SOURCE_TEST_ONLY.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGovernedCompartmentProvisioner} from '../governed-compartment-provision.mjs';
const cell={ownerId:'owner-fixture',bodyId:'pc-fixture',cellId:'memory',providerId:'sqlite-main',revision:'v1',role:'CANONICAL'};
const policy={storageHighPercent:80,queueHighCount:100,writeP95HighMs:400,readP95HighMs:300,maxObservationAgeMs:60000};
const metrics={ownerId:cell.ownerId,bodyId:cell.bodyId,cellId:cell.cellId,providerId:cell.providerId,revision:cell.revision,observedAtMs:999999,storageCapacityBytes:100,storageUsedBytes:90,queueDepth:0,writeP95Ms:10,readP95Ms:10};
const request={cell,metrics,policy,nowMs:1000000,requestId:'request-001'};
function providerSet(calls,overrides={}){
 const providers={
 custody:{admit:async ({requestId,proposal})=>{calls.push('ADMIT');return {authorized:true,requestId,proposalSha256:proposal.proposalSha256};},assertSingleWriter:async()=>{calls.push('SINGLE_WRITER');}},
 veritas:{pre:async ({requestId,proposal})=>{calls.push('PRE');return {verified:true,kind:'PRE',requestId,proposalSha256:proposal.proposalSha256,proofId:'pre-fixture'};},post:async ({requestId,proposal})=>{calls.push('POST');return {verified:true,kind:'POST',requestId,proposalSha256:proposal.proposalSha256,proofId:'post-fixture',preProofId:'pre-fixture'};}},
 placement:{reserve:async ({requestId,proposal})=>{calls.push('RESERVE');return {requestId,proposalSha256:proposal.proposalSha256,ownerId:cell.ownerId,bodyId:cell.bodyId,cellId:cell.cellId,resourceId:'sqlite-shard-2'};},provision:async ({requestId})=>{calls.push('PROVISION');return {committed:true,requestId,resourceId:'sqlite-shard-2',source:cell};}},
 readback:{verify:async ({requestId})=>{calls.push('READBACK');return {verified:true,requestId,resourceId:'sqlite-shard-2',sourceRevision:cell.revision,ownerId:cell.ownerId,bodyId:cell.bodyId};}},
 receipts:{append:async ({requestId})=>{calls.push('RECEIPT');return {committed:true,requestId,receiptId:'receipt-fixture'};}}
 };
 for(const [group,patch] of Object.entries(overrides))providers[group]={...providers[group],...patch};
 return providers;
}
test('healthy capacity avoids calling any providers',async()=>{
 const calls=[];const p=createGovernedCompartmentProvisioner(providerSet(calls));
 const out=await p.execute({...request,metrics:{...metrics,storageUsedBytes:10}});
 assert.equal(out.state,'NO_PROVISIONING_REQUIRED');assert.deepEqual(calls,[]);
});
test('shard source orchestration preserves complete proof order',async()=>{
 const calls=[];const p=createGovernedCompartmentProvisioner(providerSet(calls));
 const out=await p.execute(request);
 assert.deepEqual(calls,['ADMIT','PRE','SINGLE_WRITER','RESERVE','PROVISION','READBACK','POST','RECEIPT']);
 assert.equal(out.receiptId,'receipt-fixture');assert.equal(out.learningLedger,'NOT_PERFORMED_BY_THIS_ADAPTER');
});
test('missing host providers fail before any execution',()=>{
 assert.throws(()=>createGovernedCompartmentProvisioner({}),/PROVIDERS_UNBOUND/);
});
test('owner denial stops all downstream actions',async()=>{
 const calls=[];const p=createGovernedCompartmentProvisioner(providerSet(calls,{custody:{admit:async()=>{calls.push('DENY');return {authorized:false};}}}));
 await assert.rejects(p.execute(request),/OWNER_AUTHORITY_DENIED/);assert.deepEqual(calls,['DENY']);
});
test('independent pre denial stops allocation and receipt',async()=>{
 const calls=[];const p=createGovernedCompartmentProvisioner(providerSet(calls,{veritas:{pre:async()=>{calls.push('PRE_DENY');return {verified:false};}}}));
 await assert.rejects(p.execute(request),/INDEPENDENT_PRE_DENIED/);assert.deepEqual(calls,['ADMIT','PRE_DENY']);
});
test('reservation source scope mismatch stops provisioning',async()=>{
 const calls=[];const p=createGovernedCompartmentProvisioner(providerSet(calls,{placement:{reserve:async()=>{calls.push('BAD_RESERVATION');return {ownerId:'different'};}}}));
 await assert.rejects(p.execute(request),/TARGET_RESERVATION_INVALID/);assert.deepEqual(calls,['ADMIT','PRE','SINGLE_WRITER','BAD_RESERVATION']);
});
test('readback error stops post proof and receipt',async()=>{
 const calls=[];const p=createGovernedCompartmentProvisioner(providerSet(calls,{readback:{verify:async()=>{calls.push('READBACK_FAILURE');return {verified:false};}}}));
 await assert.rejects(p.execute(request),/DURABLE_READBACK_FAILED/);assert.deepEqual(calls,['ADMIT','PRE','SINGLE_WRITER','RESERVE','PROVISION','READBACK_FAILURE']);
});
test('independent post mismatch blocks canonical receipt',async()=>{
 const calls=[];const p=createGovernedCompartmentProvisioner(providerSet(calls,{veritas:{post:async ({requestId,proposal})=>{calls.push('BAD_POST');return {verified:true,kind:'POST',requestId,proposalSha256:proposal.proposalSha256,proofId:'post',preProofId:'other'};}}}));
 await assert.rejects(p.execute(request),/INDEPENDENT_POST_DENIED/);
 assert.equal(calls.includes('RECEIPT'),false);
});
