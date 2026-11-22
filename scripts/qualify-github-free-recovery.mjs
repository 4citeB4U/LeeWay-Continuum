/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.GITHUB_FREE_RECOVERY.REHEARSAL
TAG: LEEWAY.CONTINUUM.GITHUB.ACTIONS.RECOVERY.TEST.V1
5WH:
WHAT = Rehearse source-to-target Continuum exact-byte readback on separate GitHub CI jobs.
WHY = Test whether free public-repository development CPU can qualify device-independent recovery packaging.
WHO = Creator / original Continuum owner; outside support contributor, not Agent Lee.
WHERE = scripts/qualify-github-free-recovery.mjs in 4citeB4U/LeeWay-Continuum.
WHEN = 2026-11-21.
HOW = Existing owner-local storage API, strictly synthetic fixture, digest and tenant/body guards.
LICENSE = MIT, subject to existing repository and original module terms.
AUTHORITY = CI_TEST_ONLY. No real user data, new Continuum writer, online runtime, Veritas or receipt.
*/
import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {openOwnerLocalStorage} from '../src/storage/owner-local-storage.mjs';
import {CONTINUUM_AUTHORITY_REF} from '../src/authority/continuum-authority.mjs';
import {createContinuumAccountBinding} from '../src/identity/continuum-account-binding.mjs';

const schema='leeway.continuum.github-ci-recovery-drill.v1';
const fixtureMarker='LEEWAY_PUBLIC_SYNTHETIC_FIXTURE_NO_USER_CONTENT_V1';
// Synthetic source account is NOT real OIDC authentication, merely a deterministic fixture.
const syntheticAccount=Object.freeze({identityVerified:true,
 issuer:'https://identity-fixture.invalid',subject:'public-ci-fixture-owner'});
const sourceBodyId='ci-android-body';
const targetBodyId='ci-apple-body';
const sourceBinding=createContinuumAccountBinding({account:syntheticAccount,bodyId:sourceBodyId});
const targetBinding=createContinuumAccountBinding({account:syntheticAccount,bodyId:targetBodyId});
if(sourceBinding.ownerId!==targetBinding.ownerId)throw Error('CONTINUUM_GITHUB_CI_OWNER_ID_MISMATCH');
const ownerId=sourceBinding.ownerId;
const maxFixtureBytes=128*1024;
const sha=b=>createHash('sha256').update(b).digest('hex');
const fault=code=>{throw Object.assign(new Error(code),{code});};
const allowedStatus=Object.freeze({productionQualified:false,actualUserDevice:false,
  privateOwnerPayloadHandled:false,canonicalReceiptIssued:false,
  independentlyVerifiedByVeritas:false,physicalPcieTransferExecuted:false,
  persistentCpuServerProvided:false,githubUsedAsOnlineBackend:false,
  deviceIndependentTransferDrill:true});
function context(bodyId){return{ownerId,bodyId,capabilities:['continuum.read','continuum.write']};}
function authorize({ownerId:subject,bodyId}){return subject===ownerId&&[sourceBodyId,targetBodyId].includes(bodyId);}
function syntheticFixture(){
 const marker=Buffer.from(fixtureMarker+'\n','utf8');
 const bytes=Buffer.allocUnsafe(65536);
 for(let offset=0;offset<bytes.length;offset+=marker.length){
  marker.copy(bytes,offset,0,Math.min(marker.length,bytes.length-offset));
 }
 return bytes;
}
function exactManifest(m){
 if(!m||m.schema!==schema||m.classification!=='PUBLIC_SYNTHETIC_FIXTURE_ONLY'||
   m.authorityRef!==CONTINUUM_AUTHORITY_REF||m.ownerId!==ownerId||
   m.sourceBodyId!==sourceBodyId||m.targetBodyId!==targetBodyId||
   m.sourcePlatform!=='ANDROID'||m.targetPlatform!=='IOS'||
   m.portablePayloadRole!=='OWNER_SCOPED_CONTINUUM_CONTENT_ONLY'||
   m.sourceDigitalBrain!=='RETAIN_LOCAL_DEVICE_BOUND'||
   m.targetDigitalBrain!=='MUST_CREATE_SEPARATE_NATIVE_BINDING'||
   m.authenticationFixture!=='SYNTHETIC_OIDC_NOT_REAL_LOGIN'||
   m.fixtureMarker!==fixtureMarker||m.ownerRecordIssued!==false||
   m.executableServiceDeployed!==false||m.githubStorageRole!=='CI_TRANSIENT_ARTIFACT_NOT_CONTINUUM'||
   !Number.isSafeInteger(m.sizeBytes)||m.sizeBytes<1||m.sizeBytes>maxFixtureBytes||
   !/^[a-f0-9]{64}$/.test(m.contentSha256||''))fault('CONTINUUM_GITHUB_CI_MANIFEST_INVALID');
 return m;
}
async function withOriginalStore(body,callback){
 const ephemeral=await mkdtemp(join(tmpdir(),'leeway-ci-recovery-'));
 try{
  const store=await openOwnerLocalStorage({root:join(ephemeral,'original-store'),
   ownerId,bodyId:body,authorize});
  return await callback(store,context(body));
 }finally{await rm(ephemeral,{recursive:true,force:true});}
}
/** Only synthetic test data, never a production backup generator. */
export async function prepareSyntheticGithubRecovery(artifactDir){
 if(typeof artifactDir!=='string'||!artifactDir.trim())fault('CONTINUUM_GITHUB_CI_ARTIFACT_PATH_REQUIRED');
 const original=syntheticFixture();
 const result=await withOriginalStore(sourceBodyId,async(store,ctx)=>{
   const put=await store.put(original,ctx);
   const back=await store.get(put.contentSha256,ctx);
   if(!put.readbackVerified||!back.readbackVerified||
     !Buffer.from(back.bytes).equals(original))fault('CONTINUUM_GITHUB_CI_SOURCE_READBACK_INVALID');
   return {contentSha256:put.contentSha256,sizeBytes:put.sizeBytes};
 });
 const manifest=exactManifest({
  schema,classification:'PUBLIC_SYNTHETIC_FIXTURE_ONLY',
  authorityRef:CONTINUUM_AUTHORITY_REF,ownerId,sourceBodyId,targetBodyId,
  sourcePlatform:'ANDROID',targetPlatform:'IOS',
  portablePayloadRole:'OWNER_SCOPED_CONTINUUM_CONTENT_ONLY',
  sourceDigitalBrain:'RETAIN_LOCAL_DEVICE_BOUND',
  targetDigitalBrain:'MUST_CREATE_SEPARATE_NATIVE_BINDING',
  authenticationFixture:'SYNTHETIC_OIDC_NOT_REAL_LOGIN',
  fixtureMarker,ownerRecordIssued:false,executableServiceDeployed:false,
  githubStorageRole:'CI_TRANSIENT_ARTIFACT_NOT_CONTINUUM',
  contentSha256:result.contentSha256,sizeBytes:result.sizeBytes
 });
 await mkdir(artifactDir,{recursive:true});
 await writeFile(join(artifactDir,'fixture.bin'),original,{flag:'wx',mode:0o600});
 await writeFile(join(artifactDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',
  {flag:'wx',mode:0o600});
 return Object.freeze({stage:'SOURCE_JOB_PREPARED',...allowedStatus,
  fileSha256:result.contentSha256,sourceBytes:result.sizeBytes,ownerScope:ownerId,
  sourcePlatform:'ANDROID',targetPlatform:'IOS',
  nativeDeviceConnectionEstablished:false});
}
/** Restore in a separate, clean CI job to a *different body scope*, not an online service. */
export async function verifySyntheticGithubRecovery(artifactDir){
 if(typeof artifactDir!=='string'||!artifactDir.trim())fault('CONTINUUM_GITHUB_CI_ARTIFACT_PATH_REQUIRED');
 const manifest=exactManifest(JSON.parse(await readFile(join(artifactDir,'manifest.json'),'utf8')));
 const bytes=new Uint8Array(await readFile(join(artifactDir,'fixture.bin')));
 if(bytes.length!==manifest.sizeBytes||sha(bytes)!==manifest.contentSha256||
    !Buffer.from(bytes).equals(syntheticFixture()))
   fault('CONTINUUM_GITHUB_CI_ARTIFACT_INTEGRITY_INVALID');
 const result=await withOriginalStore(targetBodyId,async(store,ctx)=>{
   const put=await store.put(bytes,ctx);
   if(!put.readbackVerified||put.contentSha256!==manifest.contentSha256)
     fault('CONTINUUM_GITHUB_CI_TARGET_PUT_INVALID');
   const back=await store.get(manifest.contentSha256,ctx);
   if(!back.readbackVerified||sha(back.bytes)!==manifest.contentSha256||
      !Buffer.from(back.bytes).equals(Buffer.from(bytes)))
     fault('CONTINUUM_GITHUB_CI_TARGET_READBACK_INVALID');
   await assertForeignScopeDenied(store,manifest.contentSha256);
   return {sha256:put.contentSha256,sizeBytes:put.sizeBytes};
 });
 return Object.freeze({stage:'TARGET_JOB_RESTORED',...allowedStatus,
  fileSha256:result.sha256,targetBytes:result.sizeBytes,
  separateBodyScopeVerified:true,foreignOwnerDenied:true,
  sourcePlatform:'ANDROID',targetPlatform:'IOS',
  nativeDeviceConnectionEstablished:false,
  nativeAppleDigitalBrainCopied:false});
}
async function assertForeignScopeDenied(store,key){
 let denied=false;
 try{await store.get(key,{ownerId:'different-owner',bodyId:targetBodyId,
   capabilities:['continuum.read']});}
 catch(e){denied=e.code==='CONTINUUM_LOCAL_ACCESS_DENIED';}
 if(!denied)fault('CONTINUUM_GITHUB_CI_CROSS_OWNER_SCOPE_LEAK');
}
const cli=process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href;
if(cli){
 const mode=process.argv[2],dir=process.argv[3];
 const actions={prepare:prepareSyntheticGithubRecovery,restore:verifySyntheticGithubRecovery};
 if(!Object.hasOwn(actions,mode)||typeof dir!=='string')fault('CONTINUUM_GITHUB_CI_MODE_INVALID');
 try{const out=await actions[mode](dir);console.log(JSON.stringify(out,null,2));}
 catch(err){console.error(err.code||err.message);process.exitCode=1;}
}
