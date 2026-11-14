/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.IDENTITY
TAG: LEEWAY.CONTINUUM.PORTABLE.ACCOUNT.BINDING.V1
WHAT: Bind Continuum custody scopes to the same verified account identity used
     during portable Device Bridge enrollment.
WHY: A customer returning on a replacement device must recover their own
     Continuum without re-entering private profile data or trusting a device
     name, drive path, or raw email address.
HOW: Derive a non-reversible owner scope from verified OIDC issuer + subject,
     keep device body scope separate, and describe reconnect/readback steps.
AUTHORITY: Source contract only. JWT validation, enrollment, sync, storage
           writes, and service-entitlement issuance remain external authorities.
LICENSE: MIT
*/
import { createHash } from 'node:crypto';

const SUBJECT = /^[A-Za-z0-9._:@/-]{3,256}$/;
const BODY_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const sha256 = value => createHash('sha256').update(value, 'utf8').digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };

function normalizeAccount(account) {
  if (!account || typeof account !== 'object' || account.identityVerified !== true ||
      typeof account.issuer !== 'string' || !/^https:\/\//.test(account.issuer) ||
      !SUBJECT.test(String(account.subject || ''))) {
    fail('CONTINUUM_VERIFIED_ACCOUNT_REQUIRED');
  }
  return Object.freeze({ issuer: account.issuer.replace(/\/$/, ''), subject: account.subject });
}

/**
 * Stable across a customer's devices, opaque at rest, and deliberately not
 * derived from an email address. The upstream identity provider must verify
 * the account before this source contract is called.
 */
export function deriveContinuumOwnerScope(account) {
  const verified = normalizeAccount(account);
  return `continuum-owner-${sha256(`leeway.continuum.owner.v1\0${verified.issuer}\0${verified.subject}`)}`;
}

export function createContinuumAccountBinding({ account, bodyId } = {}) {
  const verified = normalizeAccount(account);
  if (!BODY_ID.test(String(bodyId || ''))) fail('CONTINUUM_BODY_ID_INVALID');
  return Object.freeze({
    schema: 'leeway.continuum.account-binding.v1',
    ownerId: `continuum-owner-${sha256(`leeway.continuum.owner.v1\0${verified.issuer}\0${verified.subject}`)}`,
    bodyId,
    accountIdentity: Object.freeze({ issuer: verified.issuer, subject: verified.subject }),
    emailStored: false,
    authority: 'VERIFIED_OIDC_ACCOUNT_SUBJECT',
  });
}

/**
 * Describe the only valid return path for a new device. The plan does not
 * imply that a provider is connected or that any private data was read.
 */
export function planContinuumReconnect({ account, bodyId, localBinding = null } = {}) {
  const binding = createContinuumAccountBinding({ account, bodyId });
  if (localBinding !== null && localBinding?.ownerId !== binding.ownerId) {
    fail('CONTINUUM_LOCAL_CUSTODY_ACCOUNT_MISMATCH');
  }
  return Object.freeze({
    state: 'CONTINUUM_RECONNECT_PENDING_CANONICAL_READBACK',
    binding,
    steps: Object.freeze([
      'VERIFY_AUTHENTICATED_ACCOUNT',
      'VERIFY_DEVICE_ENROLLMENT',
      'READ_CANONICAL_OWNER_INDEX',
      'NEGOTIATE_APPROVED_REPLICA',
      'READBACK_INTEGRITY_CHECK',
    ]),
    profileReentryRequired: false,
    privateDataRead: false,
  });
}

/**
 * A paid remote-service pause may stop LeeWay hosted/remote capability, but it
 * never converts customer-held Continuum data into vendor-owned collateral.
 */
export function continuumCustodyDuringServicePause() {
  return Object.freeze({
    localContinuumPreserved: true,
    localRead: true,
    localExport: true,
    remoteReplication: false,
    hostedBridgeService: false,
    deletionAuthorized: false,
  });
}
