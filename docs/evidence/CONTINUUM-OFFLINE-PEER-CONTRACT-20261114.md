<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.EVIDENCE
TAG: LEEWAY.CONTINUUM.OFFLINE.PEER.CONTRACT.CHECKPOINT.20261114
WHAT: Source-level checkpoint for portable offline peer-transfer planning and
      durable local change-journal readback.
WHY: Preserve the accepted design boundary and actual test evidence before a
     platform transport adapter or multi-device physical qualification begins.
WHEN: 2026-11-14 America/Chicago.
AUTHORITY: Creator-authorized source change. This file is a sanitized engineering
           checkpoint, not a private Receipt Authority record.
LICENSE: MIT
-->

# Continuum offline-peer contract checkpoint — 2026-11-14

## Identity and authority

- **Project:** `4citeB4U/LeeWay-Continuum`
- **Branch:** `feat/offline-peer-continuum-contract-20261114`
- **Source commit:** `da9badbe5be5f6a579a830d7efa9499a1f5ae95a`
- **Creator direction:** Build the offline Continuum/peer-transfer contract before
  adding display sharing. Digital Brain remains device-local; Continuum is the
  owner-scoped unified custody view.
- **Formula:** `LEEWAY_FORMULA_V1_PASS` health was observed from the Formula
  service on 2026-11-14T06:00:06.007Z. No Formula evaluation was executed for
  this source change.

## Accepted source behavior

`src/sync/offline-peer-transfer.mjs` adds a portable, injected-adapter contract:

1. Both bodies must have separately verified enrollment under one opaque
   Continuum owner scope.
2. Route order is `OFFLINE_DIRECT_PEER → LAN_DIRECT_PEER → INTERNET_RELAY →
   LOCAL_JOURNAL_ONLY`.
3. A selected route requires an adapter observation of availability, mutual
   authentication and encryption. It never treats a device label, address,
   account login or network association as proof.
4. With no acceptable route, a scoped local change journal remains available for
   later reconciliation; it does not manufacture a successful transfer.
5. Journal append requires owner/body capability authorization and exact injected
   durable-adapter readback. Altered readback fails closed.

## Executed evidence

| Command | Result | Scope |
| --- | --- | --- |
| `npm run check:syntax` | exit 0 | Syntax of the complete listed Continuum source set, including the new sync contract |
| `node --test src/sync/tests/offline-peer-transfer.test.mjs` | 5 passed, 0 failed | Route ordering, no-route queue, enrollment denial, journal authorization/readback, malformed/tampered negative paths |
| `npm test` | 107 passed, 0 failed, 0 skipped | Current Continuum source suite |
| `git diff --check` | exit 0 | Whitespace validation before feature commit |
| changed-file portability scan | no fixed drive or test-device binding found | New sync source and contract document |

## Evidence state

- **VERIFIED (source scope):** deterministic planner and journal-contract tests
  passed at the stated commit.
- **OBSERVED:** Formula health response only; it is not Formula task evaluation.
- **NOT EXECUTED:** Bluetooth, Wi-Fi Direct, LAN discovery, USB carrier,
  encryption-session establishment, real device transfer, unified-index write,
  Veritas evaluation, canonical Receipt Authority write/readback, deployment.
- **RECEIPT:** no production Receipt Authority receipt was created.

## Rollback and next gate

- **Rollback:** revert `da9badbe5be5f6a579a830d7efa9499a1f5ae95a`.
- **Next executable gate:** bind the existing Device Bridge's enrolled-device
  admission to a real, owner-scoped peer-transport attestation interface, then
  qualify one same-owner two-device local transfer with source/target byte hashes,
  journal readback, negative cross-owner denial and authorized receipt custody.
- **Deferred by design:** explicit consented display capture/streaming integration
  is a separate capability after this transfer gate; no screen-sharing code was
  copied or activated here.
