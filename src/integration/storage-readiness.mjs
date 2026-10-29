/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.HEALTH
TAG: LEEWAY.CONTINUUM.STORAGE_READINESS.V1
WHO: LeeWay Industries / Creator-authorized engineering
WHAT: Fail-closed check of the canonical storage, optional engines, logical cells and real readback.
WHEN: 2026-10-28
WHERE: src/integration/storage-readiness.mjs
WHY: A registered adapter is not a running storage compartment.
HOW: Verify injected host attestations and exact owner/body scoped source revisions.
AUTHORITY: SOURCE_DIAGNOSTIC_ONLY; not independent Veritas or production enrollment.
LICENSE: MIT
*/
const DENY = code => {throw Object.assign(new Error(code),{code});};
const ROLE = Object.freeze({sqlite:'CANONICAL',duckdb:'DERIVED_ANALYTICS',pouchdb:'OFFLINE_REPLICA',electric_postgresql:'SYNC_TRANSPORT'});
const CELLS = Object.freeze(['runtime-state','evidence-vault','memory','learning']);
const string = x=>typeof x==='string'&&/^[a-zA-Z0-9_.:@/-]{1,256}$/.test(x);
export async function evaluateContinuumStorageReadiness({ownerId,bodyId,registry,probe}={}){
 if(!string(ownerId)||!string(bodyId)||!Array.isArray(registry)||typeof probe!=='function') DENY('CONTINUUM_READINESS_INPUT_INVALID');
 const seen=new Set(),resources=[],cells=[];
 for(const entry of registry){
  if(!entry||!string(entry.resourceId)||!string(entry.ownerId)||!string(entry.bodyId)||
     entry.ownerId!==ownerId||entry.bodyId!==bodyId||!(entry.kind in ROLE)||
     entry.role!==ROLE[entry.kind]||seen.has(entry.resourceId)) DENY('CONTINUUM_READINESS_REGISTRY_INVALID');
  seen.add(entry.resourceId);
  let observed;
  try{observed=await probe(Object.freeze({resourceId:entry.resourceId,kind:entry.kind,ownerId,bodyId}));}
  catch{observed=null;}
  const live=observed?.healthy===true&&observed?.ownerId===ownerId&&observed?.bodyId===bodyId&&
    observed?.resourceId===entry.resourceId&&observed?.kind===entry.kind&&
    observed?.readbackVerified===true&&string(observed?.revision)&&
    observed?.originalRuntimeBound===true;
  resources.push(Object.freeze({resourceId:entry.resourceId,kind:entry.kind,role:entry.role,
    state:live?'LIVE_READBACK_OBSERVED_NOT_VERITAS_QUALIFIED':'UNVERIFIED',revision:live?observed.revision:null}));
 }
 for(const cellId of CELLS){
  const matches=registry.filter(e=>Array.isArray(e.cells)&&e.cells.includes(cellId));
  const ready=matches.filter(e=>resources.some(r=>r.resourceId===e.resourceId&&r.state.startsWith('LIVE_')));
  cells.push(Object.freeze({cellId,state:ready.length===1?'RESOURCE_READBACK_OBSERVED':'RESOURCE_UNVERIFIED_OR_AMBIGUOUS',resourceId:ready.length===1?ready[0].resourceId:null}));
 }
 const canonical=resources.filter(r=>r.kind==='sqlite'&&r.state.startsWith('LIVE_'));
 const basic=canonical.length===1&&cells.every(x=>x.state==='RESOURCE_READBACK_OBSERVED');
 return Object.freeze({schema:'leeway.continuum.storage-readiness.v1',ownerId,bodyId,resources,cells,
  basicReadiness:basic?'SOURCE_PROBE_OBSERVED':'BLOCKED',
  formulaExecuted:false,independentVeritas:'NOT_EXECUTED',receipt:'NOT_CREATED',
  learningLedger:'NOT_UPDATED',productionAccepted:false});
}
