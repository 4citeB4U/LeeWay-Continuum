/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.ECOSYSTEM.CLIENT.TEST
TAG: LEEWAY.CONTINUUM.SHARED_CONSUMER_TEST.V1
WHO: LeeWay Industries
WHAT: Test owner-scoped delegated Continuum consumer contract.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/src/integration/tests/ecosystem-consumer.test.mjs
WHY: No device-specific default, unsafely inferred host or second authority.
HOW: In-memory mocks, no physical host.
AUTHORITY: TEST_ONLY
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createContinuumConsumer,LEEWAY_CONTINUUM_CONSUMERS} from '../ecosystem-consumer.mjs';
const ownerId='owner-1',bodyId='device-a';
const context={ownerId,bodyId,capabilities:['continuum.read','continuum.write']};
const bytes=new Uint8Array([1,2,3]);
const sha=createHash('sha256').update(bytes).digest('hex');
const transport={
 status:async()=>({state:'CONNECTED'}),
 search:async()=>({records:[]}),
 getContent:async()=>({record:{contentSha256:sha},bytes}),
 ingestFile:async()=>({recordId:'record-a'})
};
const make=overrides=>createContinuumConsumer({consumerId:'agent-lee',ownerId,bodyId,
 transport,authorize:async()=>true,...overrides});
test('single portable interface supports known consumers but no auto connection',()=>{
 assert(LEEWAY_CONTINUUM_CONSUMERS.includes('device-bridge'));
 const x=make();assert.equal(x.descriptor.connected,'NOT_PROBED');
 assert.equal(x.descriptor.createsDatabase,false);
});
test('read-only consumer can search and verify exact original bytes',async()=>{
 const c=make();assert.deepEqual(await c.search({query:'test'},context),{records:[]});
 const r=await c.getContent('record-a',context);assert.equal(r.record.contentSha256,sha);
});
test('writes fail closed by default',async()=>{
 await assert.rejects(make().ingestFile({bytes,requestId:'request-a',source:{bodyId}},context),/WRITE_DISABLED/);
});
test('unknown owner/body or absent host approval is denied',async()=>{
 await assert.rejects(make().status({...context,bodyId:'wrong'}),/OWNER_DENIED/);
 await assert.rejects(make({authorize:async()=>false}).status(context),/NOT_AUTHORIZED/);
});
test('write requires opt-in host and owner scoped source',async()=>{
 const c=make({writeEnabled:true});
 assert.deepEqual(await c.ingestFile({bytes,requestId:'request-a',source:{bodyId}},context),{recordId:'record-a'});
 await assert.rejects(c.ingestFile({bytes,requestId:'request-b',source:{bodyId:'other'}},context),/WRITE_INVALID/);
});
test('bad provider hash is rejected before a consumer can use content',async()=>{
 const c=make({transport:{...transport,getContent:async()=>({bytes,record:{contentSha256:'0'.repeat(64)}})}});
 await assert.rejects(c.getContent('record-a',context),/BAD_READBACK/);
});
