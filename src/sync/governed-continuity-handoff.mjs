/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.SYNC
TAG: LEEWAY.CONTINUUM.GOVERNED_HANDOFF_V1
WHAT: Persist one owner-scoped encrypted checkpoint that can resume across devices and operating systems.
WHY: Device loss, restart, timeout, and OS change must pause or resume work without changing identity or authority.
WHO: Continuum handoff adapter under Runtime/Formula/Veritas admission supplied by the caller.
WHERE: src/sync/governed-continuity-handoff.mjs
HOW: Explicit authorization, encrypted injected persistence, idempotent keys, authenticated readback, and bounded states.
AUTHORITY: Source contract only; this module does not issue credentials, Formula decisions, Veritas decisions, or receipts.
LICENSE: MIT
*/
import { createHash } from 'node:crypto';

const ID = /^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const STATES = new Set(['QUEUED', 'PAUSED', 'RESUMED', 'FAILED', 'EXECUTED']);
const fail = code => { throw Object.assign(new Error(code), { code }); };
const hash = value => createHash('sha256').update(value).digest('hex');

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function requireContext(context, ownerId, bodyId, capability) {
  if (context?.ownerId !== ownerId || context?.bodyId !== bodyId ||
      !Array.isArray(context?.capabilities) || !context.capabilities.includes(capability)) {
    fail('CONTINUUM_HANDOFF_SCOPE_OR_CAPABILITY_DENIED');
  }
}

function normalizeCheckpoint(input, ownerId, bodyId, now) {
  const checkpoint = {
    schema: 'leeway.continuum.governed-handoff.v1',
    ownerId,
    bodyId,
    checkpointId: input?.checkpointId,
    continuityId: input?.continuityId,
    sequence: input?.sequence,
    state: input?.state,
    sourceDeviceId: input?.sourceDeviceId,
    sourcePlatform: input?.sourcePlatform,
    targetDeviceId: input?.targetDeviceId ?? null,
    targetPlatform: input?.targetPlatform ?? null,
    previousCheckpointId: input?.previousCheckpointId ?? null,
    requestId: input?.requestId,
    cursor: input?.cursor,
    payload: input?.payload,
    recordedAt: input?.recordedAt ?? now()
  };
  if (![checkpoint.checkpointId, checkpoint.continuityId, checkpoint.sourceDeviceId,
    checkpoint.sourcePlatform, checkpoint.requestId].every(value => typeof value === 'string' && ID.test(value)) ||
      (checkpoint.targetDeviceId !== null && !ID.test(checkpoint.targetDeviceId)) ||
      (checkpoint.targetPlatform !== null && !ID.test(checkpoint.targetPlatform)) ||
      (checkpoint.previousCheckpointId !== null && !ID.test(checkpoint.previousCheckpointId)) ||
      !Number.isSafeInteger(checkpoint.sequence) || checkpoint.sequence < 1 ||
      !STATES.has(checkpoint.state) || typeof checkpoint.cursor !== 'object' || checkpoint.cursor === null ||
      typeof checkpoint.payload !== 'object' || checkpoint.payload === null) {
    fail('CONTINUUM_HANDOFF_CHECKPOINT_INVALID');
  }
  const plaintext = Buffer.from(canonical(checkpoint), 'utf8');
  return Object.freeze({ checkpoint, plaintext, plaintextSha256: hash(plaintext) });
}

function validateEnvelope(envelope) {
  if (!envelope || envelope.schema !== 'leeway.continuum.governed-handoff-envelope.v1' ||
      !ID.test(envelope.checkpointId) || !ID.test(envelope.continuityId) ||
      !SHA256.test(envelope.plaintextSha256) || typeof envelope.ciphertext !== 'string' ||
      envelope.ciphertext.length === 0 || typeof envelope.algorithm !== 'string' ||
      envelope.algorithm.length === 0 || typeof envelope.keyId !== 'string' || envelope.keyId.length === 0) {
    fail('CONTINUUM_HANDOFF_ENVELOPE_INVALID');
  }
}

export function createGovernedContinuityHandoff({
  ownerId,
  bodyId,
  authorize,
  persist,
  read,
  encrypt,
  decrypt,
  now = () => new Date().toISOString()
} = {}) {
  if (typeof ownerId !== 'string' || typeof bodyId !== 'string' ||
      typeof authorize !== 'function' || typeof persist !== 'function' || typeof read !== 'function' ||
      typeof encrypt !== 'function' || typeof decrypt !== 'function') {
    fail('CONTINUUM_HANDOFF_BINDING_REQUIRED');
  }

  async function authorizeOperation(operation, checkpointId, context) {
    requireContext(context, ownerId, bodyId, `continuum.handoff.${operation}`);
    if (await authorize({ operation, ownerId, bodyId, checkpointId, context }) !== true) {
      fail('CONTINUUM_HANDOFF_AUTHORIZATION_DENIED');
    }
  }

  async function save(input, context) {
    await authorizeOperation('write', input?.checkpointId, context);
    const { checkpoint, plaintext, plaintextSha256 } = normalizeCheckpoint(input, ownerId, bodyId, now);
    const existing = await read({ key: checkpoint.checkpointId });
    if (existing) {
      validateEnvelope(existing);
      if (existing.plaintextSha256 !== plaintextSha256) fail('CONTINUUM_HANDOFF_IDEMPOTENCY_CONFLICT');
      return Object.freeze({ checkpointId: checkpoint.checkpointId, replayed: true, readbackVerified: true, state: checkpoint.state });
    }
    const encrypted = await encrypt({ plaintext, ownerId, bodyId, checkpointId: checkpoint.checkpointId });
    if (!encrypted || typeof encrypted.ciphertext !== 'string' || encrypted.ciphertext.length === 0 ||
        typeof encrypted.algorithm !== 'string' || typeof encrypted.keyId !== 'string') {
      fail('CONTINUUM_HANDOFF_ENCRYPTION_UNVERIFIED');
    }
    const envelope = {
      schema: 'leeway.continuum.governed-handoff-envelope.v1',
      ownerId,
      bodyId,
      checkpointId: checkpoint.checkpointId,
      continuityId: checkpoint.continuityId,
      sequence: checkpoint.sequence,
      state: checkpoint.state,
      sourcePlatform: checkpoint.sourcePlatform,
      targetPlatform: checkpoint.targetPlatform,
      plaintextSha256,
      ciphertext: encrypted.ciphertext,
      algorithm: encrypted.algorithm,
      keyId: encrypted.keyId
    };
    await persist({ key: checkpoint.checkpointId, envelope });
    const readback = await read({ key: checkpoint.checkpointId });
    const verified = await verifyReadback(readback, checkpoint, plaintextSha256);
    if (!verified) fail('CONTINUUM_HANDOFF_READBACK_UNVERIFIED');
    return Object.freeze({ checkpointId: checkpoint.checkpointId, replayed: false, readbackVerified: true, state: checkpoint.state });
  }

  async function readCheckpoint(checkpointId, context) {
    await authorizeOperation('read', checkpointId, context);
    if (typeof checkpointId !== 'string' || !ID.test(checkpointId)) fail('CONTINUUM_HANDOFF_CHECKPOINT_ID_INVALID');
    const envelope = await read({ key: checkpointId });
    if (!envelope) fail('CONTINUUM_HANDOFF_CHECKPOINT_NOT_FOUND');
    validateEnvelope(envelope);
    const plaintext = await decrypt({ ciphertext: envelope.ciphertext, algorithm: envelope.algorithm, keyId: envelope.keyId, ownerId, bodyId, checkpointId });
    const bytes = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext || '');
    if (hash(bytes) !== envelope.plaintextSha256) fail('CONTINUUM_HANDOFF_PLAINTEXT_HASH_MISMATCH');
    let checkpoint;
    try { checkpoint = JSON.parse(bytes.toString('utf8')); } catch { fail('CONTINUUM_HANDOFF_PLAINTEXT_INVALID'); }
    if (checkpoint.ownerId !== ownerId || checkpoint.bodyId !== bodyId || checkpoint.checkpointId !== checkpointId) {
      fail('CONTINUUM_HANDOFF_OWNER_OR_IDENTITY_MISMATCH');
    }
    return Object.freeze({ checkpoint, readbackVerified: true, encrypted: true });
  }

  async function verifyReadback(envelope, expected, expectedSha256) {
    if (!envelope) return false;
    validateEnvelope(envelope);
    if (envelope.ownerId !== ownerId || envelope.bodyId !== bodyId || envelope.checkpointId !== expected.checkpointId ||
        envelope.plaintextSha256 !== expectedSha256) return false;
    const plaintext = await decrypt({ ciphertext: envelope.ciphertext, algorithm: envelope.algorithm, keyId: envelope.keyId, ownerId, bodyId, checkpointId: expected.checkpointId });
    const bytes = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext || '');
    return hash(bytes) === expectedSha256 && canonical(JSON.parse(bytes.toString('utf8'))) === canonical(expected);
  }

  return Object.freeze({
    descriptor: Object.freeze({ schema: 'leeway.continuum.governed-handoff.v1', ownerId, bodyId, encrypted: true, productionQualified: false }),
    save,
    read: readCheckpoint
  });
}

export const CONTINUUM_HANDOFF_STATES = Object.freeze([...STATES]);
