/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.ENGINE_ADAPTERS
TAG: LEEWAY.CONTINUUM.ENGINE_ADAPTERS.V1
WHO: LeeWay Industries / creator-authorized maintainers
WHAT: Owner-governed adapters for existing SQLite, DuckDB, PouchDB and Electric/PostgreSQL providers.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/src/adapters/engine-adapters.mjs
WHY: One Continuum authority and replaceable storage engines without new database files.
HOW: Trusted-host provider injection, exact source scope and fail-closed operation authorization.
AUTHORITY: SOURCE_CANDIDATE_ONLY; no production owner/Veritas admission, database provisioning or sync.
LICENSE: MIT
*/
const deny = reason => { throw Object.assign(new Error(reason), {code:reason}); };
const valid = value => typeof value === 'string' && /^[A-Za-z0-9_.:/@-]{1,256}$/.test(value);
const engines = Object.freeze({
  sqlite: Object.freeze({role:'CANONICAL',operations:['status','getContent','ingestFile']}),
  duckdb: Object.freeze({role:'DERIVED_ANALYTICS',operations:['status','queryApproved']}),
  pouchdb: Object.freeze({role:'OFFLINE_REPLICA',operations:['status','readDocument','listDocuments']}),
  electric_postgresql: Object.freeze({role:'SYNC_TRANSPORT',operations:['status','readSnapshot']})
});
export const CONTINUUM_ENGINE_ROLES = engines;

function scopedContext(context, ownerId, bodyId, operation) {
  if (!context || context.ownerId !== ownerId || context.bodyId !== bodyId ||
      !Array.isArray(context.capabilities)) deny('CONTINUUM_OWNER_SCOPE_DENIED');
  const need = operation === 'ingestFile' ? 'continuum.write' : 'continuum.read';
  if (!context.capabilities.includes(need)) deny('CONTINUUM_CAPABILITY_DENIED');
}
export function createContinuumEngineAdapter({kind,ownerId,bodyId,resourceId,authorize,handlers}={}) {
  const definition = engines[kind];
  if (!definition || ![ownerId,bodyId,resourceId].every(valid) ||
      typeof authorize !== 'function' || !handlers || typeof handlers !== 'object') {
    deny('CONTINUUM_ENGINE_BINDING_REQUIRED');
  }
  for(const operation of definition.operations){
    if(typeof handlers[operation] !== 'function') deny('CONTINUUM_ENGINE_HANDLER_MISSING');
  }
  // Injection proves only a callable dependency, not live DB enrollment or valid production writes.
  const descriptor = Object.freeze({
    kind,role:definition.role,resourceId,ownerId,bodyId,
    bindingState:'SOURCE_INJECTED_UNQUALIFIED',liveProbe:'NOT_PERFORMED',
    createsDatabase:false,replicationQualified:false
  });
  async function invoke(operation,request,context) {
    if(!definition.operations.includes(operation)) deny('CONTINUUM_ENGINE_OPERATION_DENIED');
    scopedContext(context,ownerId,bodyId,operation);
    // The injected owner-controlled host validates signed principal and request provenance.
    // Never trust an HTTP caller's asserted context/capability string alone.
    if(await authorize({kind,role:definition.role,resourceId,ownerId,bodyId,operation,context,request}) !== true) {
      deny('CONTINUUM_ENGINE_ADMISSION_DENIED');
    }
    return handlers[operation](request,context);
  }
  return Object.freeze({descriptor,invoke});
}
export const createSqliteContinuumAdapter = args => createContinuumEngineAdapter({...args,kind:'sqlite'});
export const createDuckDbAnalyticsAdapter = args => createContinuumEngineAdapter({...args,kind:'duckdb'});
export const createPouchDbOfflineAdapter = args => createContinuumEngineAdapter({...args,kind:'pouchdb'});
export const createElectricPostgresAdapter = args => createContinuumEngineAdapter({...args,kind:'electric_postgresql'});

export function createContinuumEngineCatalog({ownerId,bodyId,adapters=[]}={}) {
  if(![ownerId,bodyId].every(valid)||!Array.isArray(adapters))deny('CONTINUUM_CATALOG_SCOPE_REQUIRED');
  const catalog = new Map();
  for(const adapter of adapters) {
    const d=adapter?.descriptor;
    if(!d || d.ownerId!==ownerId || d.bodyId!==bodyId || !valid(d.resourceId) ||
      !engines[d.kind] || d.role!==engines[d.kind].role || catalog.has(d.resourceId)) {
      deny('CONTINUUM_CATALOG_ADAPTER_INVALID');
    }
    catalog.set(d.resourceId,adapter);
  }
  return Object.freeze({
    list(){return Object.freeze([...catalog.values()].map(a=>a.descriptor));},
    async invoke(resourceId,operation,request,context){
      const adapter=catalog.get(resourceId);
      if(!adapter)deny('CONTINUUM_RESOURCE_NOT_REGISTERED');
      return adapter.invoke(operation,request,context);
    }
  });
}
