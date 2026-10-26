/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.CANONICAL.HOST
TAG: LEEWAY.CONTINUUM.EXISTING_HOST_BINDING.V1
WHO: LeeWay Industries / creator-authorized owners
WHAT: Attach the original running Continuum service to Runtime Fabric and Device Bridge.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/src/integration/canonical-host-binding.mjs
WHY: Never silently construct a second writer or mislabel a read-only Brain projection.
HOW: Trusted-host source digest + owner-scoped authorization + original service delegation.
AUTHORITY: SOURCE_ONLY. No production key enrollment or grant is created.
LICENSE: MIT
*/
import {createHash} from 'node:crypto';
const failure = reason => {throw Object.assign(new Error(reason),{code:reason});};
const identity = x => typeof x==='string' && /^[A-Za-z0-9_.:@/-]{1,256}$/.test(x);
const hash = b => createHash('sha256').update(b).digest('hex');

export function bindExistingCanonicalContinuum({service,sourceSha256,ownerId,bodyId,authorize}={}) {
 if(![ownerId,bodyId].every(identity) || !/^[a-f0-9]{64}$/.test(sourceSha256||'') ||
   typeof authorize!=='function' || typeof service?.status!=='function' ||
   typeof service?.getContent!=='function' || typeof service?.ingestFile!=='function') {
   failure('CONTINUUM_EXISTING_CANONICAL_HOST_REQUIRED');
 }
 const descriptor=Object.freeze({
   capabilityRef:'leeway.continuum',ownerId,bodyId,sourceSha256,
   implementation:'INJECTED_EXISTING_INSTANCE',createsDatabase:false,
   sourceQualification:'HOST_MUST_VERIFY_ACTUAL_BYTES',productionAdmission:'NOT_PROBED'
 });
 async function guard(operation,request,context){
   if(context?.ownerId!==ownerId || context?.bodyId!==bodyId ||
      !Array.isArray(context.capabilities))failure('CONTINUUM_HOST_OWNER_SCOPE_DENIED');
   const capability = operation==='ingestFile' ? 'continuum.write':'continuum.read';
   if(!context.capabilities.includes(capability))failure('CONTINUUM_HOST_CAPABILITY_DENIED');
   if(await authorize({ownerId,bodyId,sourceSha256,operation,request,context})!==true) {
     failure('CONTINUUM_HOST_AUTHORIZATION_DENIED');
   }
 }
 async function status(context){
   await guard('status',null,context);
   const live=await service.status(context);
   if(live?.ownerId!==ownerId || live?.bodyId!==bodyId)failure('CONTINUUM_HOST_IDENTITY_MISMATCH');
   return Object.freeze({descriptor,live});
 }
 async function getContent(recordId,context){
   await guard('getContent',{recordId},context);
   const back=await service.getContent(recordId,context);
   if(!(back?.bytes instanceof Uint8Array) ||
      !/^[a-f0-9]{64}$/.test(back.record?.contentSha256||'') ||
      hash(back.bytes)!==back.record.contentSha256){
     failure('CONTINUUM_HOST_SOURCE_READBACK_INVALID');
   }
   return back;
 }
 async function ingestFile(input,context){
   await guard('ingestFile',{requestId:input?.requestId,source:input?.source},context);
   const s=await service.status(context);
   if(s?.ownerId!==ownerId || s?.bodyId!==bodyId || s?.initialized!==true ||
      s?.writeExecutorBound!==true || s?.writeAdmissionBound!==true) {
     failure('CONTINUUM_HOST_WRITE_ADMISSION_UNQUALIFIED');
   }
   if(!(input?.bytes instanceof Uint8Array) || input.bytes.length===0 ||
      !identity(input.requestId)||!input.source?.bodyId||input.source.bodyId!==bodyId){
     failure('CONTINUUM_HOST_WRITE_REQUEST_INVALID');
   }
   const result=await service.ingestFile(input,context);
   if(!identity(result?.recordId))failure('CONTINUUM_HOST_RESULT_UNVERIFIED');
   const verified=await service.getContent(result.recordId,context);
   if(!(verified?.bytes instanceof Uint8Array) || hash(verified.bytes)!==hash(input.bytes)) {
     failure('CONTINUUM_HOST_COMMITTED_READBACK_UNVERIFIED');
   }
   // The original provider's receipt/Veritas procedures still control admission.
   return Object.freeze({...result,readbackSha256:hash(verified.bytes),bytesVerified:true,
     independentVeritas:'HOST_ORIGINAL_PROVIDER_REQUIRED'});
 }
 return Object.freeze({descriptor,status,getContent,ingestFile});
}
