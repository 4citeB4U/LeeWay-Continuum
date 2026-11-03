/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.AUTHORITY
TAG: LEEWAY.CONTINUUM.DEPLOYMENT_INDEPENDENT_AUTHORITY.V1
WHO: LeeWay Industries / creator-authorized maintainers
WHAT: Separate Continuum logical authority from owner, body, device and storage scope.
WHY: A PC, phone, OS, repository or storage resource must never become Continuum's authority.
HOW: Reuse the existing capability reference and validate it at every governed boundary.
AUTHORITY: SOURCE CONTRACT ONLY; no identity enrollment, credential issuance or runtime promotion.
LICENSE: MIT
*/

export const CONTINUUM_AUTHORITY_REF = 'leeway.continuum';
export const CONTINUUM_AUTHORITY_MODE = 'DEPLOYMENT_INDEPENDENT_LOGICAL_AUTHORITY';

const valid = value => typeof value === 'string' && /^[A-Za-z0-9_.:@/-]{1,256}$/.test(value);

export function assertContinuumAuthorityRef(value) {
  if (value !== CONTINUUM_AUTHORITY_REF) {
    throw Object.assign(new Error('CONTINUUM_AUTHORITY_REF_INVALID'), {code:'CONTINUUM_AUTHORITY_REF_INVALID'});
  }
  return value;
}

export function assertContinuumScope({ownerId, bodyId} = {}) {
  if (!valid(ownerId) || !valid(bodyId)) {
    throw Object.assign(new Error('CONTINUUM_SCOPE_INVALID'), {code:'CONTINUUM_SCOPE_INVALID'});
  }
  return Object.freeze({ownerId, bodyId, scopeKind:'OWNER_BODY_SCOPE'});
}

export function continuumAuthorityDescriptor({ownerId, bodyId, resourceId = null} = {}) {
  assertContinuumScope({ownerId, bodyId});
  if (resourceId !== null && !valid(resourceId)) {
    throw Object.assign(new Error('CONTINUUM_RESOURCE_SCOPE_INVALID'), {code:'CONTINUUM_RESOURCE_SCOPE_INVALID'});
  }
  return Object.freeze({
    authorityRef: CONTINUUM_AUTHORITY_REF,
    authorityMode: CONTINUUM_AUTHORITY_MODE,
    ownerId,
    bodyId,
    scopeKind: 'OWNER_BODY_SCOPE',
    ...(resourceId === null ? {} : {resourceId})
  });
}
