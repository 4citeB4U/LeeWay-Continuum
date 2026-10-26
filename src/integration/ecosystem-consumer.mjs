/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.ECOSYSTEM.CLIENT
TAG: LEEWAY.CONTINUUM.SHARED_CONSUMER_INTERFACE.V1
WHO: LeeWay Industries / creator-authorized maintainers
WHAT: Device-agnostic original Continuum capability client for LeeWay services.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/src/integration/ecosystem-consumer.mjs
WHY: Route all persistent records via the same owner-scoped Continuum authority.
HOW: Inject authenticated host transport and authority callbacks; deny unbound/unsafe writes.
AUTHORITY: SOURCE CANDIDATE, no JWT/issuer grants, Veritas bypass or live enrollment.
LICENSE: MIT
*/
import {createHash} from 'node:crypto';
const fail=s=>{throw Object.assign(new Error(s),{code:s});};
const ident=s=>typeof s==='string'&&/^[A-Za-z0-9_.:@/-]{1,256}$/.test(s);
const digest=b=>createHash('sha256').update(b).digest('hex');
export const LEEWAY_CONTINUUM_CONSUMERS=Object.freeze([
 'agent-lee','digital-brain','runtime-fabric','device-bridge','formula',
 'ldwmd','gpu','voice','rtc','vision','skills','model-hub',
 'maps','logistics','pocket-id','agent-vt','receipt-ledger','learning-ledger'
]);
export function createContinuumConsumer({
  consumerId,ownerId,bodyId,authorize,transport,writeEnabled=false
}={}) {
 if(!LEEWAY_CONTINUUM_CONSUMERS.includes(consumerId) || ![ownerId,bodyId].every(ident) ||
   typeof authorize!=='function'||typeof transport?.status!=='function'||
   typeof transport?.getContent!=='function'||typeof transport?.search!=='function' ||
   (writeEnabled && typeof transport?.ingestFile!=='function')) {
   fail('CONTINUUM_CONSUMER_BINDING_REQUIRED');
 }
 async function allowed(operation,request,context){
   if(context?.ownerId!==ownerId||context?.bodyId!==bodyId||!Array.isArray(context.capabilities)){
     fail('CONTINUUM_CONSUMER_OWNER_DENIED');
   }
   const need=operation==='ingestFile'?'continuum.write':'continuum.read';
   if(!context.capabilities.includes(need))fail('CONTINUUM_CONSUMER_SCOPE_DENIED');
   if(operation==='ingestFile'&&!writeEnabled)fail('CONTINUUM_CONSUMER_WRITE_DISABLED');
   if(await authorize({consumerId,ownerId,bodyId,operation,request,context})!==true){
     fail('CONTINUUM_CONSUMER_NOT_AUTHORIZED');
   }
 }
 async function getContent(recordId,context){
   await allowed('getContent',{recordId},context);
   const result=await transport.getContent(recordId,context);
   if(!(result?.bytes instanceof Uint8Array)||!/^[a-f0-9]{64}$/.test(result?.record?.contentSha256||'')||
      digest(result.bytes)!==result.record.contentSha256)fail('CONTINUUM_CONSUMER_BAD_READBACK');
   return result;
 }
 return Object.freeze({
   descriptor:Object.freeze({consumerId,ownerId,bodyId,capabilityRef:'leeway.continuum',
     writeEnabled,connected:'NOT_PROBED',hostOnly:true,createsDatabase:false}),
   async status(context){await allowed('status',null,context);return transport.status(context);},
   async search(options,context){await allowed('search',options,context);return transport.search(options,context);},
   getContent,
   async ingestFile(input,context){
     await allowed('ingestFile',{requestId:input?.requestId},context);
     if(!(input?.bytes instanceof Uint8Array)||!ident(input?.requestId)||
       input?.source?.bodyId!==bodyId)fail('CONTINUUM_CONSUMER_WRITE_INVALID');
     return transport.ingestFile(input,context);
   }
 });
}
