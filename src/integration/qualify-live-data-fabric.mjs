/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.DATA_FABRIC.QUALIFICATION
TAG: LEEWAY.CONTINUUM.LIVE_OWNER_DATA_FABRIC_PROBE.V1
DISCOVERY_PIPELINE: Voice -> Intent -> Location -> Vertical -> Ranking -> Render
5WH:
WHAT = Probe owner-admitted original Continuum record and injected real database provider statuses without writes.
WHY = Distinguish a physical data readback from source-only adapters and prohibit a substitute canonical SQLite.
WHO = LeeWay Industries, trusted owner-authorized runtime
WHERE = src/integration/qualify-live-data-fabric.mjs
WHEN = 2026-10-28
HOW = Enforce owner scope, read existing content, SHA-256 verify, then invoke existing guarded provider status handlers.
AUTHORITY: Read-only qualification evidence; does not enroll providers, grant production or issue Veritas receipts.
LICENSE: MIT
*/
import { createHash } from 'node:crypto';

const fail = code => { throw Object.assign(new Error(code), { code }); };
const ident = v => typeof v === 'string' && /^[A-Za-z0-9_.:@/-]{1,256}$/.test(v);
const sha = b => createHash('sha256').update(b).digest('hex');
const REQUIRED = Object.freeze(['sqlite','duckdb','pouchdb','electric_postgresql']);
const ROLES = Object.freeze({
  sqlite:'CANONICAL',
  duckdb:'DERIVED_ANALYTICS',
  pouchdb:'OFFLINE_REPLICA',
  electric_postgresql:'SYNC_TRANSPORT'
});
const COMPARTMENTS = Object.freeze(['cloudflare-r2','oracle-oci-object','github-release']);
const CELLS = Object.freeze(['runtime-state','evidence-vault','memory','learning']);

function getTopology(topology) {
  if(topology?.schema !== 'leeway.continuum.storage-topology.candidate.v1'
    || topology?.canonicalAuthority?.component !== 'LeeWay Continuum') fail('CONTINUUM_TOPOLOGY_REQUIRED');
  for(const [key,ids] of [['databases',REQUIRED],['storageCompartments',COMPARTMENTS],['logicalCells',CELLS]]){
    if(!Array.isArray(topology[key]) || new Set(topology[key].map(x=>x?.id)).size!==topology[key].length
      || !ids.every(id=>topology[key].some(x=>x?.id===id))) fail('CONTINUUM_TOPOLOGY_INVENTORY_INVALID');
  }
  return Object.freeze({
    compartments:topology.storageCompartments.map(x=>Object.freeze({
      id:x.id,role:x.role,sourceReportedState:x.status,liveBinding:'NOT_PROBED'
    })),
    cells:topology.logicalCells.map(x=>Object.freeze({
      id:x.id,sourceReportedState:x.state,liveBinding:'NOT_PROBED'
    }))
  });
}

export async function qualifyLiveDataFabric({consumer,catalog,context,recordId,expectedSha256,topology}={}) {
  const d=consumer?.descriptor;
  if(d?.capabilityRef!=='leeway.continuum' || d.consumerId!=='device-bridge' ||
    d.writeEnabled!==false || !ident(d.ownerId) || !ident(d.bodyId) ||
    typeof consumer.status!=='function' || typeof consumer.getContent!=='function' ||
    typeof catalog?.list!=='function' || typeof catalog?.invoke!=='function') fail('CONTINUUM_ORIGINAL_CONSUMER_AND_CATALOG_REQUIRED');
  if(context?.ownerId!==d.ownerId || context?.bodyId!==d.bodyId ||
    !Array.isArray(context.capabilities) || !context.capabilities.includes('continuum.read')) fail('CONTINUUM_OWNER_READ_SCOPE_DENIED');
  if(!ident(recordId) || !/^[a-f0-9]{64}$/.test(expectedSha256||'')) fail('CONTINUUM_EXACT_READBACK_REQUIRED');

  const inventory=getTopology(topology);
  const descriptors=catalog.list();
  if(!Array.isArray(descriptors)) fail('CONTINUUM_PROVIDER_CATALOG_INVALID');
  const byKind=new Map(), resourceIds=new Set();
  for(const provider of descriptors){
    if(!ROLES[provider?.kind] || provider?.role!==ROLES[provider.kind] ||
      !ident(provider.resourceId) || provider.ownerId!==d.ownerId || provider.bodyId!==d.bodyId ||
      byKind.has(provider.kind) || resourceIds.has(provider.resourceId)) fail('CONTINUUM_PROVIDER_IDENTITY_INVALID');
    byKind.set(provider.kind,provider);
    resourceIds.add(provider.resourceId);
  }
  if(!byKind.has('sqlite')) fail('CONTINUUM_CANONICAL_SQLITE_PROVIDER_UNBOUND');

  const live=await consumer.status(context);
  if(live?.ownerId!==d.ownerId || live?.bodyId!==d.bodyId) fail('CONTINUUM_ORIGINAL_LIVE_IDENTITY_MISMATCH');
  const readback=await consumer.getContent(recordId,context);
  if(!(readback?.bytes instanceof Uint8Array) ||
    readback.record?.contentSha256!==expectedSha256 || sha(readback.bytes)!==expectedSha256) fail('CONTINUUM_ORIGINAL_READBACK_INVALID');

  const providers=[];
  for(const kind of REQUIRED){
    const provider=byKind.get(kind);
    if(!provider){
      providers.push(Object.freeze({kind,role:ROLES[kind],status:'OPTIONAL_NOT_BOUND',productionQualified:false}));
      continue;
    }
    let state='UNVERIFIED';
    try {
      // The canonical engine adapter invokes owner authorization for every call.
      // A successful status response must bind precisely to the enrolled resource.
      const observed=await catalog.invoke(provider.resourceId,'status',{},context);
      if(observed?.ownerId===d.ownerId && observed?.bodyId===d.bodyId &&
        observed?.resourceId===provider.resourceId && observed?.kind===kind) state='IDENTITY_STATUS_OBSERVED';
    } catch {
      state='STATUS_PROBE_DENIED_OR_UNAVAILABLE';
    }
    if(kind==='sqlite' && state!=='IDENTITY_STATUS_OBSERVED') fail('CONTINUUM_CANONICAL_SQLITE_LIVE_PROBE_FAILED');
    providers.push(Object.freeze({kind,role:ROLES[kind],resourceId:provider.resourceId,
      status:state,productionQualified:false}));
  }

  return Object.freeze({
    boundary:'TRUSTED_CANONICAL_CONTINUUM',
    status:'OWNER_SCOPED_READBACK_OBSERVED',
    recordId,contentSha256:expectedSha256,byteLength:readback.bytes.byteLength,
    providers,
    storageCompartments:inventory.compartments,
    logicalCells:inventory.cells,
    migrationPerformed:false,writePerformed:false,
    snapshotRecovery:'NOT_PROBED',
    formulaReconstruction:'NOT_PROBED',
    veritasPre:'NOT_PROBED',veritasPost:'NOT_PROBED',
    receiptLedger:'NOT_PROBED',learningLedger:'NOT_PROBED',
    productionAdmission:'NOT_GRANTED_BY_READ_PROBE'
  });
}
