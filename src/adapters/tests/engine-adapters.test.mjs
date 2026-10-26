/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.ENGINE_TESTS
TAG: LEEWAY.CONTINUUM.ENGINE_TESTS.V1
WHO: LeeWay Industries
WHAT: Synthetic fixture checks for four adapter boundaries.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/src/adapters/tests/engine-adapters.test.mjs
WHY: Reject wrong owners and direct replicas-as-writers.
HOW: Node test runner, no real database, secrets or grants.
AUTHORITY: TEST_ONLY
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createContinuumEngineAdapter,createContinuumEngineCatalog,CONTINUUM_ENGINE_ROLES} from '../engine-adapters.mjs';
const ownerId='owner-1',bodyId='body-1',resourceId='db-1';
const context={ownerId,bodyId,capabilities:['continuum.read','continuum.write']};
const make=(kind,allow=true)=>{
  const handlers={};
  for(const operation of CONTINUUM_ENGINE_ROLES[kind].operations) handlers[operation]=async()=>({operation});
  return createContinuumEngineAdapter({kind,ownerId,bodyId,resourceId,authorize:async()=>allow,handlers});
};
test('all four engines are explicit and none creates a database',()=>{
 for(const kind of Object.keys(CONTINUUM_ENGINE_ROLES)){
  const a=make(kind);
  assert.equal(a.descriptor.createsDatabase,false);
  assert.equal(a.descriptor.bindingState,'SOURCE_INJECTED_UNQUALIFIED');
 }
});
test('SQLite canonical admission is injected, not self-issued',async()=>{
 const a=make('sqlite');assert.deepEqual(await a.invoke('ingestFile',{},context),{operation:'ingestFile'});
 await assert.rejects(make('sqlite',false).invoke('ingestFile',{},context),/ADMISSION_DENIED/);
});
test('derived/replica/sync engines refuse authoritative writes',async()=>{
 for(const kind of ['duckdb','pouchdb','electric_postgresql']){
  await assert.rejects(make(kind).invoke('ingestFile',{},context),/OPERATION_DENIED/);
 }
});
test('owner and body cross-scope reads fail closed',async()=>{
 const a=make('sqlite');for(const change of [{ownerId:'bad'},{bodyId:'bad'}]){
   await assert.rejects(a.invoke('getContent',{}, {...context,...change}),/SCOPE_DENIED/);
 }
});
test('capabilities required even when host authorize returns true',async()=>{
 await assert.rejects(make('sqlite').invoke('getContent',{}, {...context,capabilities:[]}),/CAPABILITY_DENIED/);
});
test('missing trusted host authorization is a configuration error',()=>{
 assert.throws(()=>createContinuumEngineAdapter({kind:'sqlite',ownerId,bodyId,resourceId,handlers:{}}),/BINDING_REQUIRED/);
});
test('catalog rejects a duplicate resource and cross-owner adapter',()=>{
 const a=make('sqlite');
 assert.throws(()=>createContinuumEngineCatalog({ownerId,bodyId,adapters:[a,a]}),/ADAPTER_INVALID/);
 assert.throws(()=>createContinuumEngineCatalog({ownerId:'other',bodyId,adapters:[a]}),/ADAPTER_INVALID/);
});
test('catalog resolves only registered source authority',async()=>{
 const cat=createContinuumEngineCatalog({ownerId,bodyId,adapters:[make('sqlite')]});
 assert.equal(cat.list().length,1);
 await assert.rejects(cat.invoke('absent','getContent',{},context),/RESOURCE_NOT_REGISTERED/);
 assert.deepEqual(await cat.invoke(resourceId,'getContent',{},context),{operation:'getContent'});
});
