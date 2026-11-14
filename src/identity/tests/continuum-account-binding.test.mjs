import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createContinuumAccountBinding,
  planContinuumReconnect,
  continuumCustodyDuringServicePause,
} from '../continuum-account-binding.mjs';

const account = { identityVerified: true, issuer: 'https://identity.example.test/', subject: 'user-stable-oidc-subject-01' };

test('the same verified account receives one stable owner scope across replacement devices', () => {
  const original = createContinuumAccountBinding({ account, bodyId: 'windows-device-01' });
  const replacement = createContinuumAccountBinding({ account, bodyId: 'iphone-device-02' });
  assert.equal(original.ownerId, replacement.ownerId);
  assert.notEqual(original.bodyId, replacement.bodyId);
  assert.equal(original.accountIdentity.issuer, 'https://identity.example.test');
  assert.equal(Object.hasOwn(original, 'email'), false);
  assert.equal(original.emailStored, false);
});

test('reconnect plans use existing custody identity and do not demand private profile reentry', () => {
  const existing = createContinuumAccountBinding({ account, bodyId: 'windows-device-01' });
  const plan = planContinuumReconnect({ account, bodyId: 'android-device-03', localBinding: existing });
  assert.equal(plan.state, 'CONTINUUM_RECONNECT_PENDING_CANONICAL_READBACK');
  assert.equal(plan.profileReentryRequired, false);
  assert.equal(plan.privateDataRead, false);
  assert.deepEqual(plan.steps, [
    'VERIFY_AUTHENTICATED_ACCOUNT', 'VERIFY_DEVICE_ENROLLMENT', 'READ_CANONICAL_OWNER_INDEX',
    'NEGOTIATE_APPROVED_REPLICA', 'READBACK_INTEGRITY_CHECK',
  ]);
});

test('unverified account context and mismatched local custody fail closed', () => {
  assert.throws(() => createContinuumAccountBinding({ account: { issuer: account.issuer, subject: account.subject }, bodyId: 'windows-device-01' }), /CONTINUUM_VERIFIED_ACCOUNT_REQUIRED/);
  assert.throws(() => planContinuumReconnect({ account, bodyId: 'windows-device-01', localBinding: { ownerId: 'continuum-owner-wrong' } }), /CONTINUUM_LOCAL_CUSTODY_ACCOUNT_MISMATCH/);
});

test('payment lapse preserves customer-held Continuum data while disabling remote service', () => {
  assert.deepEqual(continuumCustodyDuringServicePause(), {
    localContinuumPreserved: true, localRead: true, localExport: true,
    remoteReplication: false, hostedBridgeService: false, deletionAuthorized: false,
  });
});
