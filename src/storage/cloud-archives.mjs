/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.CLOUD
TAG: LEEWAY.CONTINUUM.ENCRYPTED_OBJECT_ARCHIVE.V1
WHO: LeeWay Industries / creator-authorized maintainers
WHAT: Bounded encrypted object chunks for Cloudflare R2 and OCI Object Storage.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/src/storage/cloud-archives.mjs
WHY: Use optional cloud capacity as non-authoritative verifiable copies of original Continuum.
HOW: Owner-authorized injected seal/open and S3-compatible transports; exact independent readback.
AUTHORITY: SOURCE_CANDIDATE_ONLY. Does not grant cloud credentials, encrypt autonomously,
 issue Veritas/Receipt/Learning attestations or change canonical DB placement.
LICENSE: MIT
*/
import {createHash} from 'node:crypto';
const fail = message => { throw Object.assign(new Error(message),{code:message}); };
const id = x => typeof x==='string' && /^[A-Za-z0-9_.:@/-]{1,256}$/.test(x);
const sha = x => createHash('sha256').update(x).digest('hex');
const MAX_CHUNK = 4*1024*1024;
const TYPES = Object.freeze(['cloudflare-r2','oracle-oci-object']);
const authorized = (context,ownerId,bodyId) =>
  !!context && context.ownerId===ownerId && context.bodyId===bodyId &&
  Array.isArray(context.capabilities) && context.capabilities.includes('continuum.archive');
export function createEncryptedObjectArchive({
  kind,ownerId,bodyId,resourceId,authorize,crypto,transport,maxChunkBytes=MAX_CHUNK
}={}) {
  if(!TYPES.includes(kind) || ![ownerId,bodyId,resourceId].every(id) ||
    typeof authorize!=='function' || typeof crypto?.seal!=='function' || typeof crypto?.open!=='function' ||
    typeof transport?.putObject!=='function' || typeof transport?.getObject!=='function' ||
    !Number.isSafeInteger(maxChunkBytes) || maxChunkBytes<1 || maxChunkBytes>MAX_CHUNK) {
    fail('CONTINUUM_CLOUD_ARCHIVE_HOST_REQUIRED');
  }
  const ownerScope=sha(Buffer.from(ownerId+'\0'+bodyId));
  const descriptor=Object.freeze({
    kind,resourceId,ownerScope,role:'ENCRYPTED_RECOVERY_COPY',limitBytes:maxChunkBytes,
    createsDatabase:false,productionQualified:false,credentialSource:'TRUSTED_HOST_ONLY'
  });
  async function archive({bytes,requestId,context}={}) {
    if(!id(requestId)||!authorized(context,ownerId,bodyId))fail('CONTINUUM_ARCHIVE_OWNER_DENIED');
    if(!(bytes instanceof Uint8Array)||bytes.length===0||bytes.length>maxChunkBytes)fail('CONTINUUM_ARCHIVE_CHUNK_INVALID');
    if(await authorize({ownerId,bodyId,kind,resourceId,operation:'archive',requestId,context})!==true){
      fail('CONTINUUM_ARCHIVE_ADMISSION_DENIED');
    }
    const original=new Uint8Array(bytes),originalSha256=sha(original);
    const sealed=await crypto.seal(original,{ownerScope,requestId,originalSha256});
    if(!(sealed?.ciphertext instanceof Uint8Array) || sealed.ciphertext.length===0 ||
      sealed?.algorithm!=='AES-256-GCM' || typeof sealed?.nonce!=='string' || sealed.nonce.length<12 ||
      sealed?.ownerScope!==ownerScope) fail('CONTINUUM_ARCHIVE_ENVELOPE_INVALID');
    const ciphertext=new Uint8Array(sealed.ciphertext);
    const ciphertextSha256=sha(ciphertext);
    // Identical plaintext may be independently re-encrypted for versioned backups.
    const key='continuum/'+ownerScope+'/'+requestId+'/'+ciphertextSha256;
    const metadata=Object.freeze({
      schema:'leeway.continuum.cloud-chunk.v1',kind,ownerScope,requestId,
      algorithm:sealed.algorithm,nonce:sealed.nonce,originalSha256,ciphertextSha256
    });
    // Transport must come from credentialed trusted host. It must refuse overwrites.
    await transport.putObject({key,bytes:ciphertext,metadata,ifNoneMatch:'*'});
    const back=await transport.getObject({key});
    if(!(back?.bytes instanceof Uint8Array)||sha(back.bytes)!==ciphertextSha256){
      fail('CONTINUUM_ARCHIVE_CIPHERTEXT_READBACK_MISMATCH');
    }
    const restored=await crypto.open(new Uint8Array(back.bytes),metadata);
    if(!(restored instanceof Uint8Array)||sha(restored)!==originalSha256){
      fail('CONTINUUM_ARCHIVE_PLAINTEXT_READBACK_MISMATCH');
    }
    // Not a canonical Continuum receipt: host must publish one only after independent approval.
    return Object.freeze({key,kind,resourceId,originalSha256,ciphertextSha256,
      originalBytes:original.length,ciphertextBytes:ciphertext.length,verifiedReadback:true,
      independentVeritas:'NOT_PROBED',canonicalReceipt:'NOT_CREATED'});
  }
  return Object.freeze({descriptor,archive});
}
// GitHub Releases holds approved release artifacts/manifests, never a live DB backend.
export function createGithubReleaseArchiveManifest({
  repository,tag,assetName,sha256,sizeBytes,classification
}={}) {
  if(!/^4citeB4U\/[A-Za-z0-9_.-]{1,100}$/.test(repository||'') ||
     !/^continuum-v[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$/.test(tag||'') ||
     !/^[A-Za-z0-9_.-]{1,128}$/.test(assetName||'') ||
     !/^[a-f0-9]{64}$/.test(sha256||'') ||
     !Number.isSafeInteger(sizeBytes) || sizeBytes<1 || sizeBytes>=2*1024*1024*1024 ||
     !['PUBLIC_RELEASE','ENCRYPTED_RELEASE_EVIDENCE'].includes(classification)) {
    fail('CONTINUUM_GITHUB_RELEASE_MANIFEST_INVALID');
  }
  return Object.freeze({repository,tag,assetName,sha256,sizeBytes,classification,
    purpose:'VERSIONED_RELEASE_ONLY',bytesUploaded:false,liveDatabase:false});
}
