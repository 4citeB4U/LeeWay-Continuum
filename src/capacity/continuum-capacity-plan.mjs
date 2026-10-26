/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.CAPACITY
TAG: LEEWAY.CONTINUUM.CAPACITY_PROPOSAL.V1
WHO: LeeWay Industries / owner-authorized development
WHAT: Deterministic read-only capacity/replication intent for existing canonical Continuum cells.
WHEN: 2026-10-26
WHERE: machine-consciousness/continuum/continuum-capacity-plan.mjs
WHY: Distinguish real database pressure from visual honeycomb expansion; avoid accidental second writers.
HOW: Evaluate bounded, owner-scoped measurements against explicitly injected policy; propose, never execute.
AUTHORITY: DIAGNOSTIC_SOURCE_ONLY. No allocation, DB creation, copy, replication, grants, receipt or production promotion.
LICENSE: MIT
*/
import { createHash } from 'node:crypto';

const code = message => Object.assign(new Error(message), { code: message });
const nonempty = value => typeof value === 'string' && value.length <= 256 && /^[A-Za-z0-9_.:@/-]+$/.test(value);
const nat = value => Number.isSafeInteger(value) && value >= 0;
const positive = value => Number.isSafeInteger(value) && value > 0;
const boundedPercent = value => Number.isFinite(value) && value >= 0 && value <= 100;
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/**
 * Diagnostic intent only. Only the trusted canonical runtime can authenticate observations,
 * enroll new resources, reserve a namespace, copy admitted data, and commit a placement change.
 * No user-defined request body or derived metric can become a storage authority.
 */
export function planContinuumCapacity({cell, metrics, policy, nowMs} = {}) {
  if (!cell || ![cell.ownerId, cell.bodyId, cell.cellId, cell.providerId, cell.revision].every(nonempty) ||
      !['CANONICAL', 'DERIVED'].includes(cell.role)) throw code('CONTINUUM_CAPACITY_CELL_INVALID');
  if (!policy || !boundedPercent(policy.storageHighPercent) || policy.storageHighPercent < 50 || policy.storageHighPercent > 95 ||
      !positive(policy.queueHighCount) || !positive(policy.writeP95HighMs) || !positive(policy.readP95HighMs) ||
      !positive(policy.maxObservationAgeMs)) throw code('CONTINUUM_CAPACITY_POLICY_INVALID');
  if (!nat(nowMs)) throw code('CONTINUUM_CAPACITY_CLOCK_INVALID');
  if (!metrics || !nat(metrics.observedAtMs) || metrics.observedAtMs > nowMs ||
      !positive(metrics.storageCapacityBytes) || !nat(metrics.storageUsedBytes) ||
      metrics.storageUsedBytes > metrics.storageCapacityBytes ||
      !nat(metrics.queueDepth) || !nat(metrics.writeP95Ms) || !nat(metrics.readP95Ms) ||
      !nonempty(metrics.providerId) || !nonempty(metrics.cellId) || !nonempty(metrics.revision) ||
      !nonempty(metrics.ownerId) || !nonempty(metrics.bodyId)) {
    throw code('CONTINUUM_CAPACITY_OBSERVATION_INVALID');
  }
  if ([['ownerId',cell.ownerId],['bodyId',cell.bodyId],['cellId',cell.cellId],['providerId',cell.providerId],['revision',cell.revision]]
    .some(([key,value]) => metrics[key] !== value)) throw code('CONTINUUM_CAPACITY_OBSERVATION_SCOPE_MISMATCH');
  const ageMs = nowMs - metrics.observedAtMs;
  const storagePercent = Number((metrics.storageUsedBytes * 100 / metrics.storageCapacityBytes).toFixed(3));
  const reasons = [];
  if (storagePercent >= policy.storageHighPercent) reasons.push('STORAGE_HIGH');
  if (metrics.queueDepth >= policy.queueHighCount) reasons.push('QUEUE_HIGH');
  if (metrics.writeP95Ms >= policy.writeP95HighMs) reasons.push('WRITE_LATENCY_HIGH');
  if (metrics.readP95Ms >= policy.readP95HighMs) reasons.push('READ_LATENCY_HIGH');
  // Stale measurements cannot establish current capacity or justify provisioning.
  const stale = ageMs > policy.maxObservationAgeMs;
  const requestedOperation = stale ? 'NONE' :
    reasons.some(x => x !== 'READ_LATENCY_HIGH') ? 'PROPOSE_NEW_OWNER_SCOPED_SHARD' :
    reasons.includes('READ_LATENCY_HIGH') ? 'PROPOSE_READ_REPLICA' : 'NONE';
  const decision = Object.freeze({
    state: stale ? 'UNVERIFIED_STALE_OBSERVATION' : requestedOperation === 'NONE' ? 'WITHIN_OBSERVED_BUDGET' : 'CAPACITY_ACTION_PROPOSED',
    requestedOperation,
    ownerId: cell.ownerId, bodyId: cell.bodyId, cellId: cell.cellId, providerId: cell.providerId,
    sourceRevision: cell.revision, sourceRole: cell.role,
    observedAtMs: metrics.observedAtMs, observationAgeMs: ageMs,
    storagePercent, reasons: stale ? ['STALE_OBSERVATION'] : reasons,
    executionAuthorized: false,
    // A proposal does not allocate disk or networking, enroll an owner/issuer, replicate records,
    // change canonical authority or provide a second writer. The host must do all of those gates.
    requires: requestedOperation === 'NONE' ? [] : [
      'TRUSTED_OWNER_SIGNED_PLACEMENT', 'INDEPENDENT_VERITAS_PRE', 'QUALIFIED_TARGET_CAPACITY',
      'SINGLE_CANONICAL_WRITER', 'SCOPE_BOUND_SNAPSHOT_OR_CHANGE_STREAM',
      'DURABLE_HASH_READBACK', 'INDEPENDENT_VERITAS_POST', 'RECEIPT_AND_LEARNING_ADMISSION'
    ]
  });
  return Object.freeze({...decision, proposalSha256:sha(decision)});
}
