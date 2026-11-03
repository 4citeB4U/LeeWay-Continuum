/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.LOCAL
TAG: LEEWAY.CONTINUUM.OWNER_LOCAL_STORAGE.V1
WHO: LeeWay Industries / Creator-authorized engineering
WHAT: Bounded real filesystem backing store for original Continuum.
WHEN: 2026-11-03
WHERE: src/storage/owner-local-storage.mjs
WHY: Establish real local durability without pretending to connect MEGA or Google.
HOW: Scoped SHA-256 paths, exclusive writes, durable file fsync, owner authorization and readback.
AUTHORITY: SOURCE_COMPONENT_ONLY; original canonical host must enroll. Not a second database.
LICENSE: MIT
*/
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,open,readFile,lstat,realpath,unlink,link} from 'node:fs/promises';
import {join,resolve} from 'node:path';
const fault=code=>{throw Object.assign(new Error(code),{code});};
const ident=v=>typeof v==='string'&&/^[A-Za-z0-9_.:@-]{1,128}$/.test(v)&&v!=='.'&&v!=='..';
const digest=b=>createHash('sha256').update(b).digest('hex');
const keyOk=k=>typeof k==='string'&&/^[a-f0-9]{64}$/.test(k);
export async function openOwnerLocalStorage({root,ownerId,bodyId,authorize,maxChunkBytes=4*1024*1024}={}){
 if(typeof root!=='string'||!root.trim()||![ownerId,bodyId].every(ident)||typeof authorize!=='function'||
    !Number.isSafeInteger(maxChunkBytes)||maxChunkBytes<1||maxChunkBytes>4*1024*1024) fault('CONTINUUM_LOCAL_CONFIG_INVALID');
 const base=resolve(root);
 await mkdir(base,{recursive:true,mode:0o700});
 const rootStat=await lstat(base);
 if(rootStat.isSymbolicLink()||!rootStat.isDirectory())fault('CONTINUUM_LOCAL_ROOT_UNSAFE');
 if(await realpath(base)!==base)fault('CONTINUUM_LOCAL_ROOT_ALIAS_DENIED');
 const scopeHash=digest(Buffer.from(ownerId+'\0'+bodyId)),scope=join(base,scopeHash);
 await mkdir(scope,{recursive:true,mode:0o700});
 const si=await lstat(scope);
 if(si.isSymbolicLink()||!si.isDirectory()||await realpath(scope)!==scope)fault('CONTINUUM_LOCAL_SCOPE_UNSAFE');
 const targetPath=key=>join(scope,key.slice(0,2),key);
 async function guard(operation,key,context){
  if(!keyOk(key)||context?.ownerId!==ownerId||context?.bodyId!==bodyId||
     !Array.isArray(context.capabilities)||!context.capabilities.includes(operation==='put'?'continuum.write':'continuum.read')||
     await authorize({operation,ownerId,bodyId,contentSha256:key,context})!==true)fault('CONTINUUM_LOCAL_ACCESS_DENIED');
 }
 async function verifiedPath(key){
  const si=await lstat(scope);
  if(si.isSymbolicLink()||await realpath(scope)!==scope)fault('CONTINUUM_LOCAL_SCOPE_UNSAFE');
  const parent=join(scope,key.slice(0,2));
  const pi=await lstat(parent);
  if(pi.isSymbolicLink()||!pi.isDirectory()||await realpath(parent)!==parent)fault('CONTINUUM_LOCAL_PATH_UNSAFE');
  const ti=await lstat(targetPath(key));
  if(ti.isSymbolicLink()||!ti.isFile())fault('CONTINUUM_LOCAL_PATH_UNSAFE');
  return targetPath(key);
 }
 async function get(key,context){
  await guard('get',key,context);
  const data=new Uint8Array(await readFile(await verifiedPath(key)));
  if(digest(data)!==key)fault('CONTINUUM_LOCAL_READBACK_MISMATCH');
  return Object.freeze({contentSha256:key,bytes:data,readbackVerified:true});
 }
 async function put(bytes,context){
  if(!(bytes instanceof Uint8Array)||bytes.length===0||bytes.length>maxChunkBytes)fault('CONTINUUM_LOCAL_CHUNK_INVALID');
  const data=new Uint8Array(bytes),key=digest(data);
  await guard('put',key,context);
  const dir=join(scope,key.slice(0,2));
  await mkdir(dir,{recursive:true,mode:0o700});
  const pi=await lstat(dir);
  if(pi.isSymbolicLink()||!pi.isDirectory()||await realpath(dir)!==dir)fault('CONTINUUM_LOCAL_PATH_UNSAFE');
  const tmp=join(dir,'.'+randomUUID()+'.partial');
  let fh;
  try{
   fh=await open(tmp,'wx',0o600);
   await fh.writeFile(data);await fh.sync();await fh.close();fh=null;
   try{await link(tmp,targetPath(key));}catch(err){if(err?.code!=='EEXIST')throw err;}
  }finally{if(fh)await fh.close();await unlink(tmp).catch(()=>{});}
  const readback=new Uint8Array(await readFile(await verifiedPath(key)));
  if(digest(readback)!==key)fault('CONTINUUM_LOCAL_READBACK_MISMATCH');
  return Object.freeze({contentSha256:key,sizeBytes:data.length,readbackVerified:true,
    role:'LOCAL_CONTENT_BACKING_NOT_CANONICAL_RECORD_INDEX',productionQualified:false});
 }
 return Object.freeze({descriptor:Object.freeze({role:'LOCAL_CONTENT_BACKING_NOT_CANONICAL_RECORD_INDEX',
    ownerScope:scopeHash,root:base,createsDatabase:false,productionQualified:false}),put,get});
}
