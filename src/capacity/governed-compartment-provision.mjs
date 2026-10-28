/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.PROVISION
TAG: LEEWAY.CONTINUUM.GOVERNED_COMPARTMENT_PROVISION.V1
WHO: LeeWay Industries / Creator-authorized engineering
WHAT: Connect existing capacity proposal to trusted host provisioning lifecycle.
WHY: Proposed shards and replicas cannot become real compartments without governed execution and readback.
WHERE: src/capacity/governed-compartment-provision.mjs
WHEN: 2026-10-28
HOW: Inject existing authenticated runtime custody, independent PRE/POST, single writer guard, and durable readback.
AUTHORITY: SOURCE_INTEGRATION_CANDIDATE; live host, Veritas and Receipt not enrolled.
LICENSE: MIT
*/
import {planContinuumCapacity} from './continuum-capacity-plan.mjs';

const fault=s=>{throw Object.assign(new Error(s),{code:s});};
const identity=(a,b)=>a?.ownerId===b?.ownerId&&a?.bodyId===b?.bodyId&&a?.cellId===b?.cellId&&a?.providerId===b?.providerId&&a?.revision===b?.revision;
const validProof=(p,kind,plan,requestId)=>p?.verified===true&&p.kind===kind&&p.proposalSha256===plan.proposalSha256&&p.requestId===requestId&&typeof p.proofId==='string'&&p.proofId.length>0;

/**
 * Trusted caller injects AUTHENTICATED functions bound to live Runtime/Veritas/Receipt providers.
 * A caller-supplied plan, callback, owner string or model response never confers authority.
 * The admitted capability is narrowly scoped to CREATE a separate derived or canonical shard,
 * not to replace/reassign the original canonical writer.
 */
export function createGovernedCompartmentProvisioner({custody,veritas,placement,readback,receipts}={}){
 if(typeof custody?.admit!=='function'||typeof custody?.assertSingleWriter!=='function'||
   typeof veritas?.pre!=='function'||typeof veritas?.post!=='function'||
   typeof placement?.reserve!=='function'||typeof placement?.provision!=='function'||
   typeof readback?.verify!=='function'||typeof receipts?.append!=='function')
   fault('CONTINUUM_TRUSTED_PROVIDERS_UNBOUND');
 return Object.freeze({
   async execute({cell,metrics,policy,nowMs,requestId}={}){
     if(typeof requestId!=='string'||!/^[-a-zA-Z0-9_.:]{8,128}$/.test(requestId))
       fault('CONTINUUM_REQUEST_ID_INVALID');
     const proposal=planContinuumCapacity({cell,metrics,policy,nowMs});
     if(proposal.requestedOperation==='NONE')
       return Object.freeze({state:'NO_PROVISIONING_REQUIRED',proposalSha256:proposal.proposalSha256,receiptId:null});
     const admitted=await custody.admit({requestId,proposal,cell});
     if(admitted?.authorized!==true||admitted?.requestId!==requestId||
        admitted?.proposalSha256!==proposal.proposalSha256)
       fault('CONTINUUM_OWNER_AUTHORITY_DENIED');
     const pre=await veritas.pre({requestId,proposal,admission:admitted});
     if(!validProof(pre,'PRE',proposal,requestId))
       fault('CONTINUUM_INDEPENDENT_PRE_DENIED');
     await custody.assertSingleWriter({requestId,proposal,pre});
     const reservation=await placement.reserve({requestId,proposal,pre});
     if(!reservation||reservation.requestId!==requestId||
       reservation.proposalSha256!==proposal.proposalSha256||
       reservation.ownerId!==cell.ownerId||reservation.bodyId!==cell.bodyId||
       reservation.cellId!==cell.cellId||typeof reservation.resourceId!=='string'||
       reservation.resourceId===cell.providerId||reservation.resourceId.length===0)
       fault('CONTINUUM_TARGET_RESERVATION_INVALID');
     // No further mutation if independent PRE or reservations are absent or mismatched.
     const created=await placement.provision({requestId,proposal,pre,reservation});
     if(created?.committed!==true||created?.requestId!==requestId||
        created?.resourceId!==reservation.resourceId||!identity(created.source,cell))
       fault('CONTINUUM_PROVISION_NOT_CONFIRMED');
     const observation=await readback.verify({requestId,proposal,reservation,created});
     if(observation?.verified!==true||observation?.resourceId!==reservation.resourceId||
        observation?.requestId!==requestId||observation?.sourceRevision!==cell.revision||
        observation?.ownerId!==cell.ownerId||observation?.bodyId!==cell.bodyId)
       fault('CONTINUUM_DURABLE_READBACK_FAILED');
     const post=await veritas.post({requestId,proposal,pre,reservation,observation});
     if(!validProof(post,'POST',proposal,requestId)||post.preProofId!==pre.proofId)
       fault('CONTINUUM_INDEPENDENT_POST_DENIED');
     const receipt=await receipts.append({requestId,proposal,pre,post,reservation,observation});
     if(receipt?.committed!==true||receipt?.requestId!==requestId||
       typeof receipt.receiptId!=='string'||receipt.receiptId.length===0)
       fault('CONTINUUM_CANONICAL_RECEIPT_UNCONFIRMED');
     return Object.freeze({state:'SOURCE_PATH_COMPLETED_PROVIDER_ATTESTATIONS_REQUIRED',
       requestId,proposalSha256:proposal.proposalSha256,resourceId:reservation.resourceId,
       preProofId:pre.proofId,postProofId:post.proofId,receiptId:receipt.receiptId,
       learningLedger:'NOT_PERFORMED_BY_THIS_ADAPTER'});
   }
 });
}
