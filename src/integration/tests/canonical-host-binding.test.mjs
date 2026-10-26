/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.CANONICAL.HOST_TEST
TAG: LEEWAY.CONTINUUM.CANONICAL.HOST_TEST.V1
WHO: LeeWay Industries
WHAT: Fail-closed fixture proofs for existing-service reuse.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/src/integration/tests/canonical-host-binding.test.mjs
WHY: Prevent replacement of the 25k-record owner service with a new fixture.
HOW: In-memory service and test-only authority callback.
AUTHORITY: TEST_ONLY
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {bindExistingCanonicalContinuum} from '../canonical-host-binding.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
const ownerId='owner-1',bodyId='body-1',context={ownerId,bodyId,capabilities:['continuum.read','continuum.write']};
const bytes=new Uint8Array([10,20,30]);
const service={
 status:async()=>({ownerId,bodyId,initialized:true,writeExecutorBound:true,writeAdmissionBound:true}),
 getContent:async()=>({bytes,record:{contentSha256:digest(bytes)}}),
 ingestFile:async()=>({recordId:'r-1'})
};
const args={ownerId,bodyId,sourceSha256:'a'.repeat(64),authorize:async()=>true,service};
test('binds original injected service without constructing database',async()=>{
 const b=bindExistingCanonicalContinuum(args);
 assert.equal(b.descriptor.createsDatabase,false);
 assert.equal((await b.status(context)).live.initialized,true);
 assert.equal((await b.getContent('r-1',context)).record.contentSha256,digest(bytes));
});
test('requires pinned source identity and trusted authorization',()=>{
 assert.throws(()=>bindExistingCanonicalContinuum({...args,sourceSha256:''}),/HOST_REQUIRED/);
 assert.throws(()=>bindExistingCanonicalContinuum({...args,authorize:null}),/HOST_REQUIRED/);
});
test('wrong owner and denied host reject reads',async()=>{
 const b=bindExistingCanonicalContinuum(args);
 await assert.rejects(b.getContent('r-1',{...context,ownerId:'other'}),/SCOPE_DENIED/);
 await assert.rejects(bindExistingCanonicalContinuum({...args,authorize:async()=>false}).getContent('r-1',context),/AUTHORIZATION_DENIED/);
});
test('readback hash mismatch rejects synthetic untrusted provider',async()=>{
 const b=bindExistingCanonicalContinuum({...args,service:{...service,getContent:async()=>({bytes,record:{contentSha256:'0'.repeat(64)}})}});
 await assert.rejects(b.getContent('r-1',context),/READBACK_INVALID/);
});
test('read-only projected provider cannot accept writes',async()=>{
 const b=bindExistingCanonicalContinuum({...args,service:{...service,status:async()=>({...await service.status(),writeExecutorBound:false})}});
 await assert.rejects(b.ingestFile({bytes,requestId:'request-1',source:{bodyId}},context),/WRITE_ADMISSION_UNQUALIFIED/);
});
test('write rejects missing source body and independently verifies original bytes',async()=>{
 const b=bindExistingCanonicalContinuum(args);
 await assert.rejects(b.ingestFile({bytes,requestId:'req',source:{}},context),/WRITE_REQUEST_INVALID/);
 const r=await b.ingestFile({bytes,requestId:'req',source:{bodyId}},context);
 assert.equal(r.bytesVerified,true);
});
