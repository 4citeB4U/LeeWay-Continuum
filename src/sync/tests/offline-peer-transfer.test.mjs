import test from 'node:test';
import assert from 'node:assert/strict';
import { createOfflineContinuumJournal, planOfflinePeerTransfer } from '../offline-peer-transfer.mjs';

const ownerId = `continuum-owner-${'a'.repeat(64)}`;
const source = { ownerId, bodyId: 'windows-device-01', enrollmentVerified: true, deviceKeyId: 'device-key-windows-01' };
const target = { ownerId, bodyId: 'iphone-device-02', enrollmentVerified: true, deviceKeyId: 'device-key-iphone-02' };
const secure = { available: true, mutuallyAuthenticated: true, encrypted: true };

test('an enrolled owner routes offline direct peers before LAN and relay', () => {
  const plan = planOfflinePeerTransfer({ ownerId, source, target, connectivity: { direct: secure, lan: secure, relay: secure } });
  assert.equal(plan.route, 'OFFLINE_DIRECT_PEER');
  assert.equal(plan.canTransferNow, true);
  assert.equal(plan.digitalBrain, 'DEVICE_LOCAL_NOT_TRANSFERRED_BY_THIS_CONTRACT');
  assert.equal(plan.physicalTransportExecuted, false);
});

test('the planner falls back in order and retains local changes if no secure route is present', () => {
  assert.equal(planOfflinePeerTransfer({ ownerId, source, target, connectivity: { lan: secure } }).route, 'LAN_DIRECT_PEER');
  assert.equal(planOfflinePeerTransfer({ ownerId, source, target, connectivity: { relay: secure } }).route, 'INTERNET_RELAY');
  const offline = planOfflinePeerTransfer({ ownerId, source, target, connectivity: { direct: { available: true } } });
  assert.equal(offline.route, 'LOCAL_JOURNAL_ONLY');
  assert.equal(offline.queuedForReconciliation, true);
});

test('cross-owner, unenrolled, or same-body transfer plans fail closed', () => {
  assert.throws(() => planOfflinePeerTransfer({ ownerId, source: { ...source, ownerId: 'continuum-owner-' + 'b'.repeat(64) }, target }), /CONTINUUM_PEER_ENROLLMENT_REQUIRED/);
  assert.throws(() => planOfflinePeerTransfer({ ownerId, source, target: { ...target, enrollmentVerified: false } }), /CONTINUUM_PEER_ENROLLMENT_REQUIRED/);
  assert.throws(() => planOfflinePeerTransfer({ ownerId, source, target: source }), /CONTINUUM_PEER_ENROLLMENT_REQUIRED/);
});

test('journal append requires scoped authorization and exact durable readback', async () => {
  const records = new Map();
  const journal = createOfflineContinuumJournal({
    ownerId, bodyId: source.bodyId, authorize: async () => true,
    appendRecord: async ({ key, record }) => records.set(key, record),
    readRecord: async ({ key }) => records.get(key),
  });
  const context = { ownerId, bodyId: source.bodyId, capabilities: ['continuum.journal.append'] };
  const saved = await journal.append({ sequence: 1, entryId: 'continuum://documents/report.txt', operation: 'UPSERT', contentSha256: 'c'.repeat(64), createdAt: '2026-11-14T12:00:00Z' }, context);
  assert.equal(saved.readbackVerified, true);
  assert.match(saved.record.recordSha256, /^[a-f0-9]{64}$/);
  await assert.rejects(journal.append({ sequence: 2, entryId: 'continuum://documents/report.txt', operation: 'TOMBSTONE', createdAt: '2026-11-14T12:01:00Z' }, { ...context, capabilities: [] }), /CONTINUUM_JOURNAL_ACCESS_DENIED/);
});

test('journal refuses altered readback and malformed content records', async () => {
  const journal = createOfflineContinuumJournal({
    ownerId, bodyId: source.bodyId, authorize: async () => true,
    appendRecord: async () => {}, readRecord: async () => ({ altered: true }),
  });
  const context = { ownerId, bodyId: source.bodyId, capabilities: ['continuum.journal.append'] };
  await assert.rejects(journal.append({ sequence: 1, entryId: 'item', operation: 'UPSERT', contentSha256: 'z'.repeat(64), createdAt: '2026-11-14T12:00:00Z' }, context), /CONTINUUM_CHANGE_CONTENT_INVALID/);
  await assert.rejects(journal.append({ sequence: 1, entryId: 'item', operation: 'TOMBSTONE', createdAt: '2026-11-14T12:00:00Z' }, context), /CONTINUUM_JOURNAL_READBACK_MISMATCH/);
});
