/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.DATA_FABRIC.QUALIFICATION.TEST
TAG: LEEWAY.CONTINUUM.LIVE_OWNER_DATA_FABRIC_PROBE.TEST.V1
DISCOVERY_PIPELINE: Voice -> Intent -> Location -> Vertical -> Ranking -> Render
5WH:
WHAT = Exercise read-only canonical consumer and actual engine adapter invocation contracts with fixtures.
WHY = Prevent cross-owner and invalid source adapters from masquerading as live database connection.
WHO = LeeWay Industries, owner-authorized maintainers
WHERE = src/integration/tests/qualify-live-data-fabric.test.mjs
WHEN = 2026-10-28
HOW = Deterministic Node tests, real existing catalog implementation and synthetic guarded handlers.
AUTHORITY: Source contract tests only; no production owner record or provider access.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {qualifyLiveDataFabric} from '../qualify-live-data-fabric.mjs';
import {createSqliteContinuumAdapter,createDuckDbAnalyticsAdapter,createContinuumEngineCatalog} from '../../adapters/engine-adapters.mjs';

const bytes=new Uint8Array(Buffer.from('existing-owner-record-test-only'));
const digest=createHash('sha256').update(bytes).digest('hex');
const context={ownerId:'owner-test',bodyId:'body-test',capabilities:['continuum.read']};
const topology={
 schema:'leeway.continuum.storage-topology.candidate.v1',
 canonicalAuthority:{component:'LeeWay Continuum'},
 databases:['sqlite','duckdb','pouchdb','electric_postgresql'].map(id=>({id,status:'UNBOUND',role:id})),
 storageCompartments:['cloudflare-r2','oracle-oci-object','github-release'].map(id=>({id,status:'UNBOUND',role:id})),
 logicalCells:['runtime-state','evidence-vault','memory','learning'].map(id=>({id,state:'UNVERIFIED'}))
};
function fixture({wrongLiveOwner=false,corrupt=false,sqliteStatusDenied=false,withDuck=false}={}){
 let read=0,write=0,adapterStatus=0;
 const consumer={descriptor:{capabilityRef:'leeway.continuum',consumerId:'device-bridge',ownerId:context.ownerId,bodyId:context.bodyId,writeEnabled:false},
 async status(){return {ownerId:wrongLiveOwner?'wrong':context.ownerId,bodyId:context.bodyId};},
 async getContent(){read++;return {bytes:corrupt?new Uint8Array(Buffer.from('invalid')):bytes,record:{contentSha256:digest}};}};
 const handlers={status:async()=>{
  adapterStatus++;
  if(sqliteStatusDenied)throw new Error('DENIED');
  return {ownerId:context.ownerId,bodyId:context.bodyId,resourceId:'sqlite-original',kind:'sqlite'};
 },getContent:async()=>{read++;return {};},ingestFile:async()=>{write++;return {};}};
 const adapters=[createSqliteContinuumAdapter({ownerId:context.ownerId,bodyId:context.bodyId,resourceId:'sqlite-original',authorize:async()=>true,handlers})];
 if(withDuck)adapters.push(createDuckDbAnalyticsAdapter({ownerId:context.ownerId,bodyId:context.bodyId,resourceId:'duck-derived',authorize:async()=>true,
 handlers:{status:async()=>({ownerId:context.ownerId,bodyId:context.bodyId,resourceId:'duck-derived',kind:'duckdb'}),queryApproved:async()=>[]}}));
 const catalog=createContinuumEngineCatalog({ownerId:context.ownerId,bodyId:context.bodyId,adapters});
 return {consumer,catalog,calls:()=>({read,write,adapterStatus})};
}
const run=(f,overrides={})=>qualifyLiveDataFabric({consumer:f.consumer,catalog:f.catalog,context,recordId:'record-existing',expectedSha256:digest,topology,...overrides});

test('original record and guarded SQLite status observed; never production granted',async()=>{
 const f=fixture();
 const v=await run(f);
 assert.equal(v.status,'OWNER_SCOPED_READBACK_OBSERVED');
 assert.equal(v.providers[0].status,'IDENTITY_STATUS_OBSERVED');
 assert.equal(v.providers[1].status,'OPTIONAL_NOT_BOUND');
 assert.equal(v.storageCompartments.length,3);
 assert.equal(v.logicalCells.length,4);
 assert.equal(v.productionAdmission,'NOT_GRANTED_BY_READ_PROBE');
 assert.equal(v.writePerformed,false);
 assert.deepEqual(f.calls(),{read:1,write:0,adapterStatus:1});
});
test('optional analytics can be probed independently but never becomes canonical',async()=>{
 const v=await run(fixture({withDuck:true}));
 assert.equal(v.providers[1].status,'IDENTITY_STATUS_OBSERVED');
 assert.equal(v.providers.every(x=>x.productionQualified===false),true);
});
test('cross-owner and missing capability denied before original read',async()=>{
 const f=fixture();
 await assert.rejects(run(f,{context:{...context,ownerId:'other'}}),/CONTINUUM_OWNER_READ_SCOPE_DENIED/);
 await assert.rejects(run(f,{context:{...context,capabilities:[]}}),/CONTINUUM_OWNER_READ_SCOPE_DENIED/);
 assert.deepEqual(f.calls(),{read:0,write:0,adapterStatus:0});
});
test('wrong original live identity and tampered bytes denied',async()=>{
 await assert.rejects(run(fixture({wrongLiveOwner:true})),/CONTINUUM_ORIGINAL_LIVE_IDENTITY_MISMATCH/);
 await assert.rejects(run(fixture({corrupt:true})),/CONTINUUM_ORIGINAL_READBACK_INVALID/);
});
test('no SQLite or failing trusted status denies qualification',async()=>{
 const f=fixture();
 const missing=createContinuumEngineCatalog({ownerId:context.ownerId,bodyId:context.bodyId,adapters:[]});
 await assert.rejects(run(f,{catalog:missing}),/CONTINUUM_CANONICAL_SQLITE_PROVIDER_UNBOUND/);
 await assert.rejects(run(fixture({sqliteStatusDenied:true})),/CONTINUUM_CANONICAL_SQLITE_LIVE_PROBE_FAILED/);
});
test('writable client, fake provider and incomplete inventory denied',async()=>{
 const f=fixture();f.consumer.descriptor.writeEnabled=true;
 await assert.rejects(run(f),/CONTINUUM_ORIGINAL_CONSUMER_AND_CATALOG_REQUIRED/);
 const g=fixture();
 await assert.rejects(run(g,{topology:{...topology,logicalCells:[]}}),/CONTINUUM_TOPOLOGY_INVENTORY_INVALID/);
});
