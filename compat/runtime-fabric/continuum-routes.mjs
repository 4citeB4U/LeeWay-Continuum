/* REGION: LEEWAY.CONTINUUM.ADAPTER; TAG: LEEWAY.CONTINUUM.HTTP.OWNER.ROUTES
WHAT: Serve the approved Continuum UI and one owner-scoped data contract inside an existing server.
WHY: Human inspection and Agent Lee retrieval must share source identities.
WHO: Leeway Industries / Creator-authorized Agent Lee. WHERE: Existing Runtime Fabric carrier or qualified host adapter.
WHEN: 2026-10-07. HOW: Restricted same-origin routes, trusted server binding and bounded payloads.
AGENTS: ASSESS EXECUTE VERIFY. LICENSE: MIT */
import fs from 'node:fs';
import path from 'node:path';
const ASSETS=new Map([['index.html','text/html; charset=utf-8'],['continuum.css','text/css; charset=utf-8'],['continuum-app.mjs','text/javascript; charset=utf-8'],['continuum-sphere.mjs','text/javascript; charset=utf-8'],
['continuum-depth.mjs','text/javascript; charset=utf-8'],
['continuum-media.mjs','text/javascript; charset=utf-8'],
['mammoth.browser.min.js','application/javascript; charset=utf-8'],
['purify.min.js','application/javascript; charset=utf-8']]);
const LOCAL=new Set(['127.0.0.1','::1','::ffff:127.0.0.1']);
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Referrer-Policy':'same-origin'};
const json=(res,status,value)=>{res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
const machineCode=e=>/^[A-Z0-9_]+$/.test(e?.code||e?.message||'')?(e.code||e.message):'CONTINUUM_PROVIDER_FAILURE';
export function isLocalContinuumRequest(req){
  const host=String(req.headers.host||''),origin='http://'+host;
  return LOCAL.has(req.socket.remoteAddress)&&/^(127\.0\.0\.1|localhost):[0-9]+$/.test(host)&&(!req.headers.origin||req.headers.origin===origin)&&req.headers['sec-fetch-site']!=='cross-site';
}
export async function readBoundedJson(req,maxBytes=10000){
  const chunks=[];let bytes=0;
  for await(const chunk of req){const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);bytes+=data.length;if(bytes>maxBytes)throw Error('REQUEST_TOO_LARGE');chunks.push(data);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
}
export function createContinuumRoutes({resolveProvider,uiDirectory,uiPrefix='/continuum-ui/',apiPrefix='/api/continuum/',maxUploadBytes=16*1024*1024}){
  if(typeof resolveProvider!=='function'||!uiDirectory)throw Error('CONTINUUM_BINDING_REQUIRED');
  return async function handleContinuum(req,res,url){
    const u=url||new URL(req.url,'http://localhost');if(!u.pathname.startsWith(uiPrefix)&&!u.pathname.startsWith(apiPrefix))return false;
    const host=String(req.headers.host||''),origin='http://'+host;
    if(!isLocalContinuumRequest(req)){json(res,403,{ok:false,error:'CONTINUUM_LOCAL_OWNER_ORIGIN_REQUIRED'});return true;}
    try{
      if(u.pathname.startsWith(uiPrefix)){const asset=u.pathname.slice(uiPrefix.length)||'index.html';if(req.method!=='GET'||!ASSETS.has(asset)){json(res,404,{ok:false,error:'CONTINUUM_ASSET_NOT_ADMITTED'});return true;}const data=fs.readFileSync(path.join(uiDirectory,asset));res.writeHead(200,{...headers,'Content-Type':ASSETS.get(asset),'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; frame-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'"});res.end(data);return true;}
      const{provider,context}=await resolveProvider();if(!provider||!context)throw Error('CONTINUUM_PROVIDER_UNBOUND');const route=u.pathname.slice(apiPrefix.length);let result;
      const options={viewId:u.searchParams.get('viewId')||undefined,universeId:u.searchParams.get('universeId')||undefined,query:u.searchParams.get('query')||undefined,cursor:u.searchParams.get('cursor')||undefined,limit:u.searchParams.has('limit')?Number(u.searchParams.get('limit')):undefined};
      if(req.method==='GET'){
        if(route==='status'){result=await (provider.status?provider.status(context):provider.describe(context));result={...result,importMaxBytes:Math.min(maxUploadBytes,result.limits?.maxFileBytes??maxUploadBytes)};}
        else if(route==='counts')result=await provider.counts(context);
        else if(route==='records')result=await provider.list(options,context);
        else if(route==='record')result=await provider.inspect(u.searchParams.get('recordId'),context);
        else if(route==='receipt'){if(typeof provider.getReceipt!=='function')throw Error('CONTINUUM_RECEIPT_PROVIDER_UNBOUND');result=await provider.getReceipt(u.searchParams.get('receiptId'),context);}
        else if(route==='search')result=await provider.search(options,context);
        else if(route==='content'){const content=await provider.getContent(u.searchParams.get('recordId'),context);res.writeHead(200,{...headers,'Content-Type':content.record.mimeType||'application/octet-stream','Content-Length':String(content.bytes.length),'X-Continuum-Content-SHA256':content.record.contentSha256||'','Content-Disposition':'attachment; filename="continuum-record"','Content-Security-Policy':"sandbox; default-src 'none'"});res.end(content.bytes);return true;}
        else{json(res,404,{ok:false,error:'CONTINUUM_OPERATION_NOT_FOUND'});return true;}
      }else if(req.method==='POST'&&route==='import'){
        if(req.headers.origin!==origin||req.headers['x-continuum-request']!=='owner-import'||req.headers['content-type']!=='application/octet-stream'){json(res,403,{ok:false,error:'CONTINUUM_OWNER_IMPORT_REQUIRED'});return true;}
        const status=await (provider.status?provider.status(context):provider.describe(context));if(status.initialized===false||status.writeExecutorBound!==true||status.writeAdmissionBound!==true)throw Error('CONTINUUM_STORAGE_ADMISSION_UNBOUND');
        const requestId=u.searchParams.get('requestId');if(!requestId||!/^[a-zA-Z0-9_.:-]{16,128}$/.test(requestId))throw Error('CONTINUUM_REQUEST_ID_INVALID');
        const declared=Number(req.headers['content-length']||0);if(declared>maxUploadBytes)throw Error('CONTINUUM_UPLOAD_LIMIT');const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>maxUploadBytes)throw Error('CONTINUUM_UPLOAD_LIMIT');chunks.push(chunk);}
        result=await provider.ingestFile({bytes:Buffer.concat(chunks),title:u.searchParams.get('title'),mimeType:u.searchParams.get('mimeType')||'application/octet-stream',viewId:u.searchParams.get('viewId')||undefined,requestId,collection:'Owner imports',source:{kind:'OWNER_FILE_IMPORT',id:'owner-ui',bodyId:context.bodyId}},context);
      }else{json(res,405,{ok:false,error:'CONTINUUM_METHOD_NOT_ADMITTED'});return true;}
      json(res,200,{ok:true,result});
    }catch(e){const reason=machineCode(e);const status=/DENIED|OUTSIDE_BODY|ORIGIN/.test(reason)?403:/NOT_FOUND/.test(reason)?404:/LIMIT|INVALID/.test(reason)?400:/UNBOUND|UNCALIBRATED|NOT_INITIALIZED/.test(reason)?503:409;const failure={ok:false,error:reason,completed:false};if(reason==='CONTINUUM_COMMITTED_UNVERIFIED'||reason==='CONTINUUM_RECONCILIATION_REQUIRED'){failure.committed=e.details?.committed===true;for(const field of ['requestId','recordId'])if(typeof e.details?.[field]==='string'&&/^[a-zA-Z0-9_.:-]{1,160}$/.test(e.details[field]))failure[field]=e.details[field];failure.reconciliationRequired=true;}json(res,status,failure);}
    return true;
  };
}