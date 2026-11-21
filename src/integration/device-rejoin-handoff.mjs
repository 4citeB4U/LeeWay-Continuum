/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.INTEGRATION.DEVICE_REJOIN
TAG: LEEWAY.CONTINUUM.NATIVE_DEVICE.REJOIN_HANDOFF.V1
5WH:
WHAT = Execute bounded, original-owner Continuum record rejoin through injected authentic Runtime and Device Bridge capabilities.
WHY = Make cross-device restore a source-integrated read/stage/readback operation, not a GitHub artifact simulation or second database.
WHO = Creator and original Continuum/Runtime/Device Bridge owners; outside assistant contributes under review, not Agent Lee.
WHERE = src/integration/device-rejoin-handoff.mjs in 4citeB4U/LeeWay-Continuum.
WHEN = 2026-11-21.
HOW = Original account binding, authenticated native enrollment, fenced Runtime grant, existing Continuum getContent, native stage/readback, exact SHA.
LICENSE = MIT under original repository terms.
AUTHORITY = HOST-INJECTED INTEGRATION CANDIDATE. No local credential verification, grants, independent Veritas, receipt writer or production deployment.
*/
import {createHash} from 'node:crypto';
import {createContinuumAccountBinding,planContinuumReconnect} from '../identity/continuum-account-binding.mjs';
import {CONTINUUM_AUTHORITY_REF} from '../authority/continuum-authority.mjs';

const fail=code=>{throw Object.assign(new Error(code),{code});};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:@/-]{2,127}$/.test(v);
const sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const digest=b=>createHash('sha256').update(b).digest('hex');
const platforms=new Set(['android','ios','windows','linux']);
const MAX_REJOIN_BYTES=4*1024*1024;

/**
 * Trusted callbacks are injected by the ORIGINAL owner/runtime; this module
 * does not enumerate, reach, open, or authorize devices by itself.
 */
export function createContinuumDeviceRejoinHandoff({
 authenticateOwner,enrollDevice,resolveOriginalContinuum,authorizeRestore,
 stageDeviceContent,readbackDeviceContent
}={}){
 for(const fn of [authenticateOwner,enrollDevice,resolveOriginalContinuum,authorizeRestore,
   stageDeviceContent,readbackDeviceContent])
  if(typeof fn!=='function')fail('CONTINUUM_REJOIN_ORIGINAL_HOST_BINDINGS_REQUIRED');
 async function restoreOne({sessionRef,deviceId,bodyId,platform,recordId,workId}={}){
  if(![sessionRef,deviceId,bodyId,recordId,workId].every(id)||!platforms.has(platform))
    fail('CONTINUUM_REJOIN_REQUEST_INVALID');
  // Never accept a caller-supplied owner/issuer/scope as proof. Only the
  // injected trusted authenticator may provide verified identity.
  const account=await authenticateOwner({sessionRef,deviceId,bodyId,platform,workId});
  const binding=createContinuumAccountBinding({account,bodyId});
  const plan=planContinuumReconnect({account,bodyId});
  const enrollment=await enrollDevice({sessionRef,deviceId,bodyId,platform,
    ownerId:binding.ownerId,workId});
  if(enrollment?.state!=='ORIGINAL_DEVICE_BRIDGE_ENROLLED'||
    enrollment.ownerId!==binding.ownerId||enrollment.bodyId!==bodyId||
    enrollment.deviceId!==deviceId||enrollment.platform!==platform||
    enrollment.identityVerified!==true)
    fail('CONTINUUM_REJOIN_NATIVE_ENROLLMENT_UNVERIFIED');
  const grant=await authorizeRestore({sessionRef,workId,ownerId:binding.ownerId,
    targetBodyId:bodyId,deviceId,recordId,enrollment});
  if(grant?.state!=='ORIGINAL_RUNTIME_RESTORE_GRANTED'||
    grant.ownerId!==binding.ownerId||grant.workId!==workId||
    grant.deviceId!==deviceId||!id(grant.leaseRef)||
    !Number.isSafeInteger(grant.fencingEpoch)||grant.fencingEpoch<1)
    fail('CONTINUUM_REJOIN_RUNTIME_GRANT_UNVERIFIED');
  const original=await resolveOriginalContinuum({ownerId:binding.ownerId,recordId,
    targetBodyId:bodyId,workId,leaseRef:grant.leaseRef,fencingEpoch:grant.fencingEpoch});
  if(original?.authorityRef!==CONTINUUM_AUTHORITY_REF||
    original.ownerId!==binding.ownerId||!id(original.bodyId)||
    !sha(original.sourceSha256)||typeof original.provider?.getContent!=='function')
    fail('CONTINUUM_REJOIN_ORIGINAL_PROVIDER_REQUIRED');
  // Read from the existing source provider, preserving its native authorization.
  const sourceContext=Object.freeze({ownerId:binding.ownerId,bodyId:original.bodyId,
    capabilities:['continuum.read'],workId,leaseRef:grant.leaseRef,
    fencingEpoch:grant.fencingEpoch});
  const source=await original.provider.getContent(recordId,sourceContext);
  if(!(source?.bytes instanceof Uint8Array)||source.bytes.length===0||
    source.bytes.length>MAX_REJOIN_BYTES||
    !sha(source.record?.contentSha256)||
    digest(source.bytes)!==source.record.contentSha256)
    fail('CONTINUUM_REJOIN_SOURCE_READBACK_INVALID');
  const expectedHash=source.record.contentSha256;
  const staged=await stageDeviceContent({ownerId:binding.ownerId,deviceId,bodyId,
    platform,recordId,workId,contentSha256:expectedHash,bytes:new Uint8Array(source.bytes),
    leaseRef:grant.leaseRef,fencingEpoch:grant.fencingEpoch,
    transferRole:'PORTABLE_CONTINUUM_ONLY_NOT_DIGITAL_BRAIN'});
  if(staged?.state!=='ORIGINAL_DEVICE_BRIDGE_STAGE_ACCEPTED'||
    staged.ownerId!==binding.ownerId||staged.deviceId!==deviceId||
    staged.bodyId!==bodyId||staged.workId!==workId||
    staged.contentSha256!==expectedHash||!id(staged.transferRef))
    fail('CONTINUUM_REJOIN_DEVICE_STAGE_RECONCILIATION_REQUIRED');
  // A stage acknowledgment is not proof of a committed/usable target copy.
  const received=await readbackDeviceContent({ownerId:binding.ownerId,deviceId,bodyId,
    workId,recordId,transferRef:staged.transferRef,leaseRef:grant.leaseRef,
    fencingEpoch:grant.fencingEpoch,contentSha256:expectedHash});
  if(!(received?.bytes instanceof Uint8Array)||
    received.ownerId!==binding.ownerId||received.bodyId!==bodyId||
    received.deviceId!==deviceId||received.workId!==workId||
    digest(received.bytes)!==expectedHash||
    !Buffer.from(received.bytes).equals(Buffer.from(source.bytes)))
    fail('CONTINUUM_REJOIN_TARGET_RECONCILIATION_REQUIRED');
  // Original Veritas and Receipt Authority are explicitly downstream.
  return Object.freeze({
   state:'ORIGINAL_PROVIDER_TO_ENROLLED_DEVICE_READBACK_MATCH',
   ownerId:binding.ownerId,sourceBodyId:original.bodyId,targetBodyId:bodyId,
   platform,deviceId,workId,recordId,sourceSha256:expectedHash,
   restoredBytes:received.bytes.length,leaseRef:grant.leaseRef,
   fencingEpoch:grant.fencingEpoch,transferRef:staged.transferRef,
   originalAccountScopeUsed:true,originalContinuumProviderUsed:true,
   ownerNativeEnrollmentHostDeclared:true,targetOriginalBridgeReadback:true,
   digitalBrainHardwareStateCopied:false,
   needsIndependentPhysicalProbe:true,
   originalVeritas:'NOT_PROBED',canonicalReceipt:'NOT_CREATED',
   productionQualified:false,
   reconnectionPlanBeforeExecution:plan.state
  });
 }
 return Object.freeze({authorityRef:CONTINUUM_AUTHORITY_REF,
  role:'ORIGINAL_RUNTIME_AND_BRIDGE_BOUND_REJOIN_HANDOFF',
  createsCanonicalStorage:false,exposesGithubBackend:false,
  restoreOne});
}
