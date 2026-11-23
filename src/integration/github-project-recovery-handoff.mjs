/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.GITHUB_RECOVERY_HANDOFF
TAG: LEEWAY.CONTINUUM.OWNER_GITHUB_RECOVERY_ANCHOR.V1
5WH:
WHAT = Route occasional governed, encrypted and Formula-exact Continuum recovery checkpoints to a tenant-owned GitHub release.
WHY = Keep GitHub as independent project recovery anchor, never as Continuum's constantly written database or a second authority.
WHO = Creator-governed source contributors; exact-owner Runtime and original Continuum inject providers.
WHERE = src/integration/github-project-recovery-handoff.mjs in 4citeB4U/LeeWay-Continuum.
WHEN = 2026-11-23.
HOW = Derive original authenticated owner scope; require Continuum PRE grant, exact Formula SHA readback, encrypted snapshot and matching remote readback.
AUTHORITY = SOURCE-ONLY INTEGRATION CANDIDATE. Host injection and Veritas/receipt production qualification are independently required.
LICENSE = Existing repository MIT license.
*/
import {createHash} from 'node:crypto';
import {deriveContinuumOwnerScope} from '../identity/continuum-account-binding.mjs';
import {CONTINUUM_AUTHORITY_REF} from '../authority/continuum-authority.mjs';

const fail=code=>{throw Object.assign(new Error(code),{code})};
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:@/-]{2,159}$/.test(x);
const hex=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const bytes=x=>x instanceof Uint8Array&&x.length>0&&x.length<=4*1024*1024;
const digest=b=>createHash('sha256').update(b).digest('hex');
function githubRepo(v){
 if(typeof v!=='string'||!(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}$/.test(v)))
  fail('CONTINUUM_RECOVERY_GITHUB_REPOSITORY_INVALID');
 return v;
}
function ownerLogin(v){
 if(typeof v!=='string'||!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(v))
  fail('CONTINUUM_RECOVERY_GITHUB_OWNER_INVALID');
 return v;
}

/**
 * This is a seam into the ORIGINAL Continuum and its existing provider catalog,
 * not a new backup database. GitHub is accessed only for a governed checkpoint,
 * never for a canonical record write, continuously polling or generic file sync.
 */
export function createContinuumGithubRecoveryHandoff({
 authenticateOwner,approveCheckpoint,prepareCanonicalCheckpoint,
 publishApprovedRelease,readbackApprovedRelease
}={}){
 for(const f of [authenticateOwner,approveCheckpoint,prepareCanonicalCheckpoint,
  publishApprovedRelease,readbackApprovedRelease])
  if(typeof f!=='function')fail('CONTINUUM_RECOVERY_ORIGINAL_HOST_BINDINGS_REQUIRED');

 async function checkpoint({sessionRef,bodyId,projectRef,repositoryFullName,ownerGitHubLogin,workId}={}){
  if(![sessionRef,bodyId,projectRef,workId].every(id))
   fail('CONTINUUM_RECOVERY_REQUEST_INVALID');
  const repo=githubRepo(repositoryFullName);
  const login=ownerLogin(ownerGitHubLogin);
  if(repo.split('/')[0].toLowerCase()!==login.toLowerCase())
   fail('CONTINUUM_RECOVERY_REPOSITORY_CROSS_OWNER_DENIED');

  // Only the trusted provider can supply a verified identity; the browser
  // cannot self-assert identityVerified, issuer, subject or scope.
  const account=await authenticateOwner({sessionRef,bodyId,projectRef,workId});
  const ownerId=deriveContinuumOwnerScope(account);
  const approved=await approveCheckpoint({
   ownerId,bodyId,projectRef,workId,repositoryFullName:repo,ownerGitHubLogin:login,
   operation:'CONTINUUM_ENCRYPTED_RECOVERY_CHECKPOINT'
  });
  if(approved?.state!=='ORIGINAL_CONTINUUM_CHECKPOINT_APPROVED'||
    approved.ownerId!==ownerId||approved.projectRef!==projectRef||
    approved.repositoryFullName?.toLowerCase()!==repo.toLowerCase()||
    approved.authorityRef!==CONTINUUM_AUTHORITY_REF||!id(approved.grantRef))
    fail('CONTINUUM_RECOVERY_ORIGINAL_GRANT_REQUIRED');

  const snapshot=await prepareCanonicalCheckpoint({
   ownerId,bodyId,projectRef,workId,
   grantRef:approved.grantRef,authorityRef:CONTINUUM_AUTHORITY_REF,
   exactFormulaOnly:true,excludeLiveWAL:true,encryptForTenant:true
  });
  if(snapshot?.authorityRef!==CONTINUUM_AUTHORITY_REF||
    snapshot.ownerId!==ownerId||snapshot.projectRef!==projectRef||
    snapshot.formula?.representation!=='EXACT_LOSSLESS'||
    snapshot.formula?.reconstructionVerified!==true||
    !hex(snapshot.formula?.originalSha256)||
    snapshot.encryption?.algorithm!=='AES-256-GCM'||
    snapshot.encryption?.ownerScope!==ownerId||
    snapshot.encryption?.verified!==true||
    !bytes(snapshot.encryptedBytes)||!hex(snapshot.ciphertextSha256)||
    digest(snapshot.encryptedBytes)!==snapshot.ciphertextSha256)
    fail('CONTINUUM_RECOVERY_EXACT_ENCRYPTED_CHECKPOINT_REQUIRED');
  // A condensed/lossy mathematical projection is never restorable source.
  const expected=new Uint8Array(snapshot.encryptedBytes);
  const publication=await publishApprovedRelease({
   repositoryFullName:repo,projectRef,workId,ownerId,
   authorizationRef:approved.grantRef,
   encryptedBytes:new Uint8Array(expected),
   originalSha256:snapshot.formula.originalSha256,
   encryptedSha256:snapshot.ciphertextSha256,
   purpose:'OWNER_DISASTER_RECOVERY_CHECKPOINT_NOT_LIVE_DATABASE'
  });
  if(publication?.repositoryFullName?.toLowerCase()!==repo.toLowerCase()||
     publication.projectRef!==projectRef||publication.ownerId!==ownerId||
     !id(publication.releaseRef))
    fail('CONTINUUM_RECOVERY_PUBLICATION_UNVERIFIED');

  const received=await readbackApprovedRelease({
   repositoryFullName:repo,releaseRef:publication.releaseRef,
   ownerId,projectRef,workId
  });
  if(!bytes(received?.encryptedBytes)||
    digest(received.encryptedBytes)!==snapshot.ciphertextSha256||
    !Buffer.from(received.encryptedBytes).equals(Buffer.from(expected)))
    fail('CONTINUUM_RECOVERY_GITHUB_READBACK_MISMATCH');
  return Object.freeze({
   state:'OWNER_GITHUB_ENCRYPTED_RECOVERY_READBACK_MATCH',
   authorityRef:CONTINUUM_AUTHORITY_REF,
   ownerId,projectRef,repositoryFullName:repo,
   recoveryRole:'VERSIONED_GITHUB_RECOVERY_ANCHOR_NOT_LIVE_DATABASE',
   storageCompartments:['runtime-state','evidence-vault','memory','learning'],
   formulaMode:'EXACT_LOSSLESS_VERIFIED',
   originalSha256:snapshot.formula.originalSha256,
   ciphertextSha256:snapshot.ciphertextSha256,
   encryptedBytes:expected.length,
   releaseRef:publication.releaseRef,
   originalContinuumUsed:true,
   productionQualified:false,
   independentVeritas:'NOT_VERIFIED_BY_THIS_HANDOFF',
   receiptAuthority:'NOT_ISSUED_BY_THIS_HANDOFF',
   recoveryKeyIndependence:'NOT_PROVEN_BY_THIS_HANDOFF'
  });
 }
 return Object.freeze({
  authorityRef:CONTINUUM_AUTHORITY_REF,
  role:'GOVERNED_OWNER_PROJECT_GITHUB_RECOVERY_ANCHOR',
  continuouslyWritesToGitHub:false,
  actsAsCanonicalDatabase:false,
  usesOriginalContinuum:true,
  checkpoint
 });
}
