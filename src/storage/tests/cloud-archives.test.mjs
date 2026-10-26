/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.CLOUD_TEST
TAG: LEEWAY.CONTINUUM.CLOUD_ARCHIVE_TEST.V1
WHO: LeeWay Industries
WHAT: Fail-closed fixture tests for encrypted R2/OCI archive interfaces.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/src/storage/tests/cloud-archives.test.mjs
WHY: Prevent plaintext cloud writes, unverified readbacks and fake live capacity.
HOW: In-memory transport/crypto fixtures, no network or actual cloud account.
AUTHORITY: TEST_ONLY
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createEncryptedObjectArchive,createGithubReleaseArchiveManifest} from '../cloud-archives.mjs';
const ownerId='owner-1',bodyId='body-1',context={ownerId,bodyId,capabilities:['continuum.archive']};
const store=new Map();
const bytes=new Uint8Array([8,4,2,1,0]);
const crypto={
 async seal(original,{ownerScope}){return {ciphertext:new Uint8Array([...original].reverse()),algorithm:'AES-256-GCM',nonce:'fixture_nonce_for_test',ownerScope};},
 async open(ciphertext){return new Uint8Array([...ciphertext].reverse());}
};
const transport={
 async putObject({key,bytes}){if(store.has(key))throw Error('OBJECT_ALREADY_EXISTS');store.set(key,new Uint8Array(bytes));},
 async getObject({key}){return {bytes:store.get(key)};}
};
const make=(kind='cloudflare-r2',auth=true,trans=transport,crypt=crypto)=>
 createEncryptedObjectArchive({kind,ownerId,bodyId,resourceId:kind,authorize:async()=>auth,crypto:crypt,transport:trans});
test('both R2 and OCI require original byte recovery before accepting',async()=>{
 for(const kind of ['cloudflare-r2','oracle-oci-object']){
  const r=await make(kind).archive({bytes,requestId:kind,context});
  assert.equal(r.verifiedReadback,true);assert.equal(r.canonicalReceipt,'NOT_CREATED');
  assert.equal(r.independentVeritas,'NOT_PROBED');
 }
});
test('wrong owner and missing archive capability reject before transport',async()=>{
 await assert.rejects(make().archive({bytes,requestId:'denied-1',context:{...context,bodyId:'other'}}),/OWNER_DENIED/);
 await assert.rejects(make().archive({bytes,requestId:'denied-2',context:{...context,capabilities:[]}}),/OWNER_DENIED/);
});
test('host admission must approve every archive',async()=>{
 await assert.rejects(make('cloudflare-r2',false).archive({bytes,requestId:'denied-3',context}),/ADMISSION_DENIED/);
});
test('unverifiable encrypted content rejects before upload',async()=>{
 const bad={...crypto,async seal(){return {ciphertext:bytes,algorithm:'none',ownerScope:'other',nonce:'fixture_nonce'};}};
 await assert.rejects(make('cloudflare-r2',true,transport,bad).archive({bytes,requestId:'denied-4',context}),/ENVELOPE_INVALID/);
});
test('tampered cloud return fails hash before decrypt',async()=>{
 const wrong={...transport,async getObject(){return {bytes:new Uint8Array([1,2,3])};}};
 await assert.rejects(make('cloudflare-r2',true,wrong).archive({bytes,requestId:'denied-5',context}),/CIPHERTEXT_READBACK_MISMATCH/);
});
test('R2 and OCI do not create database or mint credentials',()=>{
 assert.equal(make().descriptor.createsDatabase,false);
 assert.equal(make().descriptor.credentialSource,'TRUSTED_HOST_ONLY');
});
test('release manifests are restricted and never upload data',()=>{
 const input={repository:'4citeB4U/LeeWay-Continuum',tag:'continuum-v0.1.0',
 assetName:'source.tar.gz',sha256:'a'.repeat(64),sizeBytes:100,classification:'PUBLIC_RELEASE'};
 assert.equal(createGithubReleaseArchiveManifest(input).bytesUploaded,false);
 assert.throws(()=>createGithubReleaseArchiveManifest({...input,classification:'LIVE_DATABASE'}),/MANIFEST_INVALID/);
});
