/* REGION: LEEWAY.CONTINUUM.FEDERATION; TAG: LEEWAY.CONTINUUM.PROVIDER.EXISTING.BRAIN
WHAT: Read existing manifest-bound PC Brain records through Continuum without copying a database.
WHY: Make retained metadata and experience records inspectable while durable intake admission is unbound.
WHO: Leeway Industries / Creator-authorized Agent Lee. WHERE: Existing Runtime Fabric carrier.
WHEN: 2026-10-07. HOW: OPEN_READONLY SQLite, parameterized queries, explicit presentation views and content hashes.
AGENTS: ASSESS EXECUTE VERIFY. LICENSE: MIT */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const alive="COALESCE(status,'') != 'tombstoned'";
const hardware="(type='hardware-component' OR id LIKE 'device-current:%')";
const definitions={knowledge:{table:'nodes',where:alive+' AND NOT '+hardware,idColumn:'id',collection:'Existing file and knowledge index',description:'Persisted Brain index records. Original file bytes are not implied by an index entry.'},devices:{table:'nodes',where:alive+' AND '+hardware,idColumn:'id',collection:'Recorded device observations',description:'Retained device observations from the existing Brain. Opening this view does not resample hardware.'},experience:{table:'experiences',where:'1=1',idColumn:'experience_id',collection:'Retained experience records',description:'Actual persisted experience records in the existing Brain; source outcomes are not newly requalified.'}};
const jsonBytes=value=>Buffer.from(JSON.stringify(value,null,2),'utf8');
function code(message){const e=new Error(message);e.code=message;return e;}
function parseJson(value,fallback){try{return JSON.parse(value);}catch{return fallback;}}
export function createExistingBrainProvider({databasePath,bodyId,ownerId=bodyId}){
  if(!databasePath||!bodyId||!ownerId||!fs.existsSync(databasePath))throw code('EXISTING_BRAIN_BINDING_REQUIRED');
  const db=new DatabaseSync(databasePath,{readOnly:true});db.exec('PRAGMA query_only=ON; PRAGMA busy_timeout=1500');
  let closed=false;
  try{for(const name of ['nodes','experiences'])if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name))throw code('EXISTING_BRAIN_SCHEMA_MISMATCH');const roots=db.prepare('SELECT id FROM nodes WHERE parent_id IS NULL').all().map(x=>x.id);if(!roots.includes('scope::hemi::L')||!roots.includes('scope::hemi::R'))throw code('EXISTING_BRAIN_ROOT_CONTRACT_MISMATCH');}catch(e){db.close();throw e;}
  function auth(context){if(closed)throw code('PROVIDER_CLOSED');if(context?.bodyId!==bodyId||context?.ownerId!==ownerId||!Array.isArray(context.capabilities)||!context.capabilities.includes('continuum.read'))throw code('CONTINUUM_OWNER_SCOPE_DENIED');}
  function resolveView(options={}){const id=options.viewId||options.universeId||'knowledge';if(!Object.hasOwn(definitions,id))return null;return{id,...definitions[id]};}
  function encodeId(view,sourceId){return 'brain:'+bodyId+':'+view+':'+Buffer.from(sourceId).toString('base64url');}
  function decodeId(recordId){const prefix='brain:'+bodyId+':';if(typeof recordId!=='string'||recordId.length>4096||!recordId.startsWith(prefix))throw code('RECORD_OUTSIDE_BODY');const tail=recordId.slice(prefix.length),colon=tail.indexOf(':'),view=tail.slice(0,colon),encoded=tail.slice(colon+1);if(!Object.hasOwn(definitions,view)||!encoded||!/^[a-zA-Z0-9_-]+$/.test(encoded))throw code('RECORD_ID_INVALID');const id=Buffer.from(encoded,'base64url').toString('utf8');if(Buffer.from(id).toString('base64url')!==encoded)throw code('RECORD_ID_INVALID');return{view,id};}
  function normalize(row,view){
    const d=definitions[view],sourceId=String(row[d.idColumn]),bytes=jsonBytes(row),experience=view==='experience',receipts=experience?parseJson(row.receipt_refs_json,[]):[];
    return{recordId:encodeId(view,sourceId),universeId:null,viewId:view,collection:d.collection,title:experience?(row.goal||row.capability_id||sourceId):(row.title||sourceId),mimeType:'application/json',byteLength:bytes.length,contentSha256:sha(bytes),ownerId,bodyId,source:{kind:'EXISTING_BRAIN_SQLITE',cellId:'device-brain',sourceRecordId:sourceId,table:d.table,representation:'RETAINED_RECORD_JSON',sourceState:experience?row.veritas_status||null:row.status||null,sourceDomain:row.domain||null,presentationOnly:true,ownerNamespace:'BODY_LOCAL',
      recordedRelativePath:!experience&&typeof row.source_path==='string'&&row.source_path.length<=1024?row.source_path:null,
      parentSourceRecordId:!experience&&typeof row.parent_id==='string'&&row.parent_id.length<=4096?row.parent_id:null,
      parentLabel:!experience&&typeof row.parent_id==='string'?db.prepare('SELECT title FROM nodes WHERE id=?').get(row.parent_id)?.title||null:null,
      recordedDepth:!experience&&Number.isInteger(row.depth)?row.depth:null},createdAt:experience?row.timestamp||row.inserted_at||null:row.created_at||null,storageKind:experience?'RETAINED_EVENT':'INDEX_REFERENCE',verification:{state:'SOURCE_RECORD_READ',scope:'PERSISTED_RECORD_REPRESENTATION',originalFileVerified:false,formulaExecution:'NOT_EXECUTED',sourceClaimsRequalified:false},receiptId:Array.isArray(receipts)?receipts[0]||null:null};
  }
  function rowFor(recordId){const{view,id}=decodeId(recordId),d=definitions[view];const row=db.prepare('SELECT * FROM '+d.table+' WHERE '+d.idColumn+'=? AND '+d.where).get(id);if(!row)throw code('RECORD_NOT_FOUND');return{view,row};}
  function readSnapshot(operation){db.exec('BEGIN');try{const result=operation();db.exec('COMMIT');return result;}catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}}
  function decodeCursor(value,maxBytes=8192){if(typeof value!=='string'||value.length>maxBytes||!/^[A-Za-z0-9_-]+$/.test(value))throw code('CURSOR_INVALID');const cursor=parseJson(Buffer.from(value,'base64url').toString('utf8'),null);if(!cursor||cursor.version!==2||cursor.bodyId!==bodyId||cursor.ownerId!==ownerId)throw code('CURSOR_SCOPE_INVALID');return cursor;}
  function encodeCursor(value){return Buffer.from(JSON.stringify({version:2,bodyId,ownerId,...value})).toString('base64url');}
  // A source-ID keyset remains stable when another authorized writer inserts or removes
  // rows before the cursor. Each call observes a read snapshot; this is not historical MVCC.
  function readPage(options={}){const view=resolveView(options);if(!view)return{records:[],nextCursor:null,total:0};const limit=options.limit??50;if(!Number.isInteger(limit)||limit<1||limit>128)throw code('PAGE_LIMIT_INVALID');let afterId=null;if(options.cursor){const cursor=decodeCursor(options.cursor);if(cursor.viewId!==view.id||typeof cursor.afterId!=='string'||cursor.afterId.length>4096)throw code('CURSOR_SCOPE_INVALID');afterId=cursor.afterId;}
    const count=db.prepare('SELECT count(*) n FROM '+view.table+' WHERE '+view.where).get().n;
    const clause=afterId===null?'':' AND '+view.idColumn+' COLLATE BINARY > ?';
    const args=afterId===null?[limit+1]:[afterId,limit+1];
    const rows=db.prepare('SELECT * FROM '+view.table+' WHERE '+view.where+clause+' ORDER BY '+view.idColumn+' COLLATE BINARY LIMIT ?').all(...args),page=rows.slice(0,limit);
    return{records:page.map(r=>normalize(r,view.id)),total:count,nextCursor:rows.length>limit?encodeCursor({viewId:view.id,afterId:String(page.at(-1)[view.idColumn])}):null,pagination:'SOURCE_ID_KEYSET_CURRENT_READ_SNAPSHOT'};
  }
  function readCounts(){const views=Object.entries(definitions).map(([id,d])=>({id,count:db.prepare('SELECT count(*) n FROM '+d.table+' WHERE '+d.where).get().n,description:d.description,presentationOnly:true,source:{cellId:'device-brain',table:d.table}}));return{total:views.reduce((n,v)=>n+v.count,0),views,universes:[],observedAt:new Date().toISOString()};}
  return{
    status(context){auth(context);const counts=this.counts(context);return{state:'READ_ONLY',label:'Connected · existing stores',ownerId,bodyId,recordCount:counts.total,writeAllowed:false,writeExecutorBound:false,writeAdmissionBound:false,writeAuthorizationMode:'READ_ONLY_PROJECTION',writeBlockReason:'Existing records are connected. This provider exposes retained Brain records; owner file intake requires the bound Continuum storage provider.',governanceState:'CONTINUUM_STORAGE_ADMISSION_UNBOUND',retrievalMode:'Source-linked lexical retrieval',providers:[{cellId:'device-brain',mode:'READ_ONLY',createsDatabase:false}]};},
    counts(context){auth(context);return readSnapshot(readCounts);},
    list(options={},context){auth(context);return readSnapshot(()=>{if(options.viewId!=='all')return readPage(options);const limit=options.limit??50;if(!Number.isInteger(limit)||limit<1||limit>128)throw code('PAGE_LIMIT_INVALID');let state={index:0,inner:null};const views=Object.keys(definitions);if(options.cursor){const c=decodeCursor(options.cursor,16384);if(c.viewId!=='all'||!Number.isInteger(c.index)||c.index<0||c.index>=views.length||(c.inner!==null&&typeof c.inner!=='string'))throw code('CURSOR_SCOPE_INVALID');state=c;}const records=[];while(state.index<views.length&&records.length<limit){const page=readPage({viewId:views[state.index],limit:limit-records.length,cursor:state.inner});records.push(...page.records);state.inner=page.nextCursor;if(state.inner)break;state.index++;}return{records,total:readCounts().total,nextCursor:state.index<views.length?encodeCursor({viewId:'all',index:state.index,inner:state.inner}):null,pagination:'SOURCE_ID_KEYSET_CURRENT_READ_SNAPSHOT'};});},
    inspect(recordId,context){auth(context);const{row,view}=rowFor(recordId);return normalize(row,view);},
    getContent(recordId,context){auth(context);const{row,view}=rowFor(recordId);return{record:normalize(row,view),bytes:jsonBytes(row)};},
    search(options,context){auth(context);const query=options?.query?.trim();if(typeof query!=='string'||query.length<2||query.length>200)throw code('QUERY_LENGTH_INVALID');const limit=options.limit??32;if(!Number.isInteger(limit)||limit<1||limit>32)throw code('SEARCH_LIMIT_INVALID');const requested=options.viewId==='all'?null:options.viewId||options.universeId;const ids=requested?(Object.hasOwn(definitions,requested)?[requested]:[]):Object.keys(definitions);const hits=[];
      for(const view of ids){if(hits.length>=limit)break;const d=definitions[view];const text=view==='experience'?"COALESCE(goal,'')||' '||COALESCE(outcome,'')||' '||COALESCE(observations_json,'')":"COALESCE(title,'')||' '||COALESCE(description,'')||' '||COALESCE(source_path,'')";
        const rows=db.prepare('SELECT * FROM '+d.table+' WHERE '+d.where+' AND instr(lower('+text+'),lower(?))>0 ORDER BY '+d.idColumn+' LIMIT ?').all(query,limit-hits.length);
        for(const row of rows){const record=normalize(row,view),body=jsonBytes(row).toString('utf8'),at=body.toLowerCase().indexOf(query.toLowerCase());hits.push({...record,snippet:body.slice(Math.max(0,at-70),Math.max(0,at-70)+420),citation:{recordId:record.recordId,bodyId,contentSha256:record.contentSha256,source:record.source},retrieval:'LEXICAL_STORED_RECORD',llmUsed:false});}}
      return{records:hits,hits,nextCursor:null,total:null,query,retrieval:'LEXICAL_STORED_RECORD',llmUsed:false};
    },
    ingestFile(){throw code('CONTINUUM_STORAGE_ADMISSION_UNBOUND');},
    ingestInteraction(){throw code('CONTINUUM_STORAGE_ADMISSION_UNBOUND');},
    close(){if(!closed){db.close();closed=true;}}
  };
}