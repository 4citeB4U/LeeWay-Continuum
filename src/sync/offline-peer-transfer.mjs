/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.SYNC
TAG: LEEWAY.CONTINUUM.OFFLINE.PEER.TRANSFER.V1
WHAT: Plan and record owner-scoped Continuum synchronization while an internet
      relay is absent, optional, or less direct than a nearby enrolled peer.
WHY: A customer's files must remain available to their own enrolled devices
     during an outage without turning a device name, LAN address, or relay into
     custody authority.
HOW: Verify one owner scope and two independently enrolled bodies; select a
     mutually authenticated encrypted direct route before LAN and relay; append
     tamper-evident change records through an injected durable journal adapter.
AUTHORITY: SOURCE CONTRACT ONLY. This module does not discover peers, establish
           Bluetooth/Wi-Fi/USB transport, copy bytes, issue receipts, or prove
           physical synchronization.
LICENSE: MIT
*/
import { createHash, randomUUID } from 'node:crypto';

const BODY_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const OWNER_ID = /^continuum-owner-[a-f0-9]{64}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const fail = code => { throw Object.assign(new Error(code), { code }); };
const hash = value => createHash('sha256').update(value, 'utf8').digest('hex');

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function validOwner(ownerId) { return typeof ownerId === 'string' && OWNER_ID.test(ownerId); }
function validBody(bodyId) { return typeof bodyId === 'string' && BODY_ID.test(bodyId); }
function validSha256(value) { return typeof value === 'string' && SHA256.test(value); }
function enrolledBody(value, ownerId) {
  return value && validBody(value.bodyId) && value.ownerId === ownerId &&
    value.enrollmentVerified === true && typeof value.deviceKeyId === 'string' && value.deviceKeyId.length >= 8;
}

/**
 * Select a route only after source and target have independent verified
 * enrollment under the same owner scope. `available` is a transport-adapter
 * observation, never a discovery claim made by this source module.
 */
export function planOfflinePeerTransfer({ ownerId, source, target, connectivity = {} } = {}) {
  if (!validOwner(ownerId) || !enrolledBody(source, ownerId) || !enrolledBody(target, ownerId) || source.bodyId === target.bodyId) {
    fail('CONTINUUM_PEER_ENROLLMENT_REQUIRED');
  }
  const direct = connectivity.direct;
  const lan = connectivity.lan;
  const relay = connectivity.relay;
  const secure = candidate => candidate?.available === true && candidate.mutuallyAuthenticated === true && candidate.encrypted === true;
  const route = secure(direct) ? 'OFFLINE_DIRECT_PEER' : secure(lan) ? 'LAN_DIRECT_PEER' : secure(relay) ? 'INTERNET_RELAY' : 'LOCAL_JOURNAL_ONLY';
  return Object.freeze({
    schema: 'leeway.continuum.peer-transfer-plan.v1',
    ownerId,
    sourceBodyId: source.bodyId,
    targetBodyId: target.bodyId,
    route,
    canTransferNow: route !== 'LOCAL_JOURNAL_ONLY',
    queuedForReconciliation: route === 'LOCAL_JOURNAL_ONLY',
    fallbackOrder: Object.freeze(['OFFLINE_DIRECT_PEER', 'LAN_DIRECT_PEER', 'INTERNET_RELAY', 'LOCAL_JOURNAL_ONLY']),
    custody: 'OWNER_SCOPED_CONTINUUM',
    digitalBrain: 'DEVICE_LOCAL_NOT_TRANSFERRED_BY_THIS_CONTRACT',
    physicalTransportExecuted: false,
  });
}

function normalizeChange({ ownerId, bodyId, operationId = randomUUID(), sequence, entryId, operation, contentSha256 = null, createdAt } = {}) {
  if (!validOwner(ownerId) || !validBody(bodyId) || typeof operationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(operationId) ||
      !Number.isSafeInteger(sequence) || sequence < 1 || typeof entryId !== 'string' || !/^[A-Za-z0-9._:@/-]{1,256}$/.test(entryId) ||
      !['UPSERT', 'TOMBSTONE'].includes(operation) || !ISO_TIME.test(String(createdAt || ''))) {
    fail('CONTINUUM_CHANGE_RECORD_INVALID');
  }
  if ((operation === 'UPSERT' && !validSha256(contentSha256)) || (operation === 'TOMBSTONE' && contentSha256 !== null)) {
    fail('CONTINUUM_CHANGE_CONTENT_INVALID');
  }
  const unsigned = { schema: 'leeway.continuum.change-record.v1', ownerId, bodyId, operationId, sequence, entryId, operation, contentSha256, createdAt };
  return Object.freeze({ ...unsigned, recordSha256: hash(canonical(unsigned)) });
}

/**
 * The journal owns only change metadata. Caller-owned adapters persist encrypted
 * content and perform transport. The mandatory readback makes an accepted write
 * distinguishable from a merely requested append.
 */
export function createOfflineContinuumJournal({ ownerId, bodyId, authorize, appendRecord, readRecord } = {}) {
  if (!validOwner(ownerId) || !validBody(bodyId) || typeof authorize !== 'function' ||
      typeof appendRecord !== 'function' || typeof readRecord !== 'function') {
    fail('CONTINUUM_JOURNAL_BINDING_REQUIRED');
  }
  async function append(change, context) {
    if (context?.ownerId !== ownerId || context?.bodyId !== bodyId || !Array.isArray(context?.capabilities) ||
        !context.capabilities.includes('continuum.journal.append') ||
        await authorize({ operation: 'append', ownerId, bodyId, context, change }) !== true) {
      fail('CONTINUUM_JOURNAL_ACCESS_DENIED');
    }
    const record = normalizeChange({ ...change, ownerId, bodyId });
    await appendRecord({ key: record.operationId, record });
    const readback = await readRecord({ key: record.operationId });
    if (!readback || canonical(readback) !== canonical(record)) fail('CONTINUUM_JOURNAL_READBACK_MISMATCH');
    return Object.freeze({ record, readbackVerified: true, durableAdapter: 'CALLER_INJECTED' });
  }
  return Object.freeze({
    descriptor: Object.freeze({ schema: 'leeway.continuum.offline-journal.v1', ownerId, bodyId, role: 'LOCAL_CHANGE_JOURNAL', productionQualified: false }),
    append,
  });
}
