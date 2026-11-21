import test from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { createGovernedContinuityHandoff } from '../governed-continuity-handoff.mjs';

const ownerId = `continuum-owner-${'a'.repeat(64)}`;
const bodyId = 'android-body-01';
const key = randomBytes(32);
const records = new Map();
const secure = {
  encrypt: async ({ plaintext }) => {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return { ciphertext: Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64'), algorithm: 'AES-256-GCM', keyId: 'continuum-test-key' };
  },
  decrypt: async ({ ciphertext }) => {
    const bytes = Buffer.from(ciphertext, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
  }
};
const context = { ownerId, bodyId, capabilities: ['continuum.handoff.write', 'continuum.handoff.read'] };
const checkpoint = {
  checkpointId: 'handoff-001', continuityId: 'mission-001', sequence: 1, state: 'PAUSED',
  sourceDeviceId: bodyId, sourcePlatform: 'android', targetDeviceId: 'linux-body-02', targetPlatform: 'linux',
  requestId: 'request-001', cursor: { stage: 'R08', offset: 4 }, payload: { queuedWork: ['device.info'] },
  recordedAt: '2026-11-21T17:30:00.000Z'
};

function make(recordStore = records) {
  return createGovernedContinuityHandoff({
    ownerId, bodyId, authorize: async () => true,
    persist: async ({ key, envelope }) => recordStore.set(key, structuredClone(envelope)),
    read: async ({ key }) => recordStore.get(key),
    ...secure
  });
}

test('encrypted checkpoint survives a new adapter instance and reads back exactly', async () => {
  const first = make();
  const saved = await first.save(checkpoint, context);
  assert.equal(saved.readbackVerified, true);
  assert.equal(saved.state, 'PAUSED');
  const second = make();
  const read = await second.read(checkpoint.checkpointId, context);
  assert.equal(read.readbackVerified, true);
  assert.equal(read.encrypted, true);
  assert.deepEqual(read.checkpoint, { schema: 'leeway.continuum.governed-handoff.v1', ownerId, bodyId, ...checkpoint, targetDeviceId: 'linux-body-02', targetPlatform: 'linux', previousCheckpointId: null, recordedAt: read.checkpoint.recordedAt });
});

test('same checkpoint is idempotent and conflicting replay is denied', async () => {
  const journal = make(new Map());
  assert.equal((await journal.save(checkpoint, context)).replayed, false);
  assert.equal((await journal.save(checkpoint, context)).replayed, true);
  await assert.rejects(journal.save({ ...checkpoint, payload: { changed: true } }, context), /CONTINUUM_HANDOFF_IDEMPOTENCY_CONFLICT/);
});

test('scope, capability, and encryption failures do not create a checkpoint', async () => {
  const journal = make();
  await assert.rejects(journal.save({ ...checkpoint, checkpointId: 'handoff-denied' }, { ...context, capabilities: [] }), /CONTINUUM_HANDOFF_SCOPE_OR_CAPABILITY_DENIED/);
  const broken = createGovernedContinuityHandoff({ ownerId, bodyId, authorize: async () => true, persist: async () => {}, read: async () => null, encrypt: async () => null, decrypt: secure.decrypt });
  await assert.rejects(broken.save({ ...checkpoint, checkpointId: 'handoff-no-encryption' }, context), /CONTINUUM_HANDOFF_ENCRYPTION_UNVERIFIED/);
  assert.equal(records.has('handoff-denied'), false);
  assert.equal(records.has('handoff-no-encryption'), false);
});
