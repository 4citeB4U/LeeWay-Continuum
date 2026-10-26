<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.EXTRACTION
TAG: LEEWAY.CONTINUUM.REPOSITORY_CUTOVER_PLAN.V1
WHO: LeeWay Industries
WHAT: Standalone repo extraction without second writer or data migration.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/docs/EXTRACTION-AND-CUTOVER.md
WHY: Preserve approved UI and existing owner runtime before independent release.
HOW: Source-prefix extraction, exact hashes, host cutover and rollback gates.
AUTHORITY: DOCUMENTED PROCEDURE ONLY; no production action executed here.
LICENSE: MIT
-->
# Continuum standalone repository cutover

## 0. Preservation gate

Existing PC Continuum has been reported CONNECTED with 25,421 records
(25,041 Brain + 380 owner storage). This is a historical user-provided
observation, NOT independently live-probed by this extraction.
Never reset the owner SQLite, WAL, Brain DB, current receipts, Pocket ID or runtime.

1. Independently read live status, owner/body IDs, initialized flag, providers,
   storage paths and counts. Pin source revision and SHA-256 of original host modules
   pc-continuum.mjs, continuum/owner-retention.mjs and canonical service factory.
2. Preserve dirty worktrees, local test outcomes and protected immutable ledger custody.
3. Capture consistent encrypted backups through qualified original data owner;
   record exact SHA-256 and restorability to a separate test host.
4. Record original source/version, UI source hashes and native window geometry.

## 1. GitHub source-only extraction

The migration source is currently isolated at:
4citeB4U/Leeway-Runtime-Fabric branch codex/continuum-repository-seed-20261026
under directory continuum-repository/.

Repository creation is separate and must be performed by an authenticated
GitHub owner; this connector cannot create a repository in this session.
Create ONE new PRIVATE empty 4citeB4U/LeeWay-Continuum repository.

In a clean temporary clone using an authenticated maintainer Git client:

    git fetch origin codex/continuum-repository-seed-20261026
    git checkout --detach FETCH_HEAD
    git subtree split --prefix=continuum-repository -b continuum-root
    git remote add continuum git@github.com:4citeB4U/LeeWay-Continuum.git
    git push continuum continuum-root:main

Use a disposable clone; do not run destructive cleanup or history rewrite
in the owner PC's dirty runtime checkout. The subtree command publishes
only staged source under continuum-repository, not the rest of Runtime Fabric.
Before publishing, verify actual GitHub destination/permissions and ensure
private databases or credentials are absent.

## 2. Native/widget UI parity

- Retain the existing Agent Lee widget host, controller, native overlays
  and SPATIAL LFW-v1.0 profile. DO NOT replace with a browser iframe, mock,
  video or redesigned sphere.
- Verify Git blob identity of every original UI asset in docs/SOURCE-PROVENANCE.md.
- Inspect and preserve third-party license notices and packaged Android SOURCE.json
  asset admission hashes; changing source location requires new signed native release
  evidence and individual physical device checks.
- Run original UI hierarchy, size/geometry and media tests. Confirm no pointer
  interaction, proportional scaling, or owner content path regression.

## 3. Interface release

- Publish a versioned Continuum source package, but keep original local owner
  provider bound until the exact original service is exposed via trusted host injection.
- Add version-pinned dependencies from Runtime Fabric Discovery, Device Bridge,
  Formula and Golden Package widget host; keep compatibility routes in the old
  repository until consumer tests and rollback pass.
- Read-only owner-scoped status and SHA-256 exact readback first.
- Canonical writes only after original owner approval, live admission,
  independent Veritas/Receipt/Learning evidence as applicable.

## 4. Optional engine/provider qualification

- SQLite: one canonical writable source, consistent online backup, restart and
  original content/hash parity. Do NOT create a new canonical DB by importing code.
- DuckDB: only rebuildable read/analytics from scoped revision-pinned snapshots.
- PouchDB: optional offline outbox + conflicts/tombstones/idempotency checks.
- Electric/PostgreSQL: optional protected cross-device transport; offline still works.
- R2 + OCI: credentials in trusted host only; encrypt before upload, count free-tier
  usage, hash-verify ciphertext and restored plaintext, rehearse independent restore.
- GitHub Releases: approved source packages and bounded encrypted release evidence,
  not an arbitrary archive of live private user records.

## 5. Dynamic storage expansion qualification

The capacity module only proposes; there is NO production shard provisioner yet.
Before any automatic database creation prove:
- real disk capacity + quota + p95 + queue telemetry and policy hysteresis
- owner-signed placement grant, approved resource ID, fencing and single writer
- durable placement journal and anti split-brain behavior
- consistent snapshot + bounded change stream + exact record/hash readback
- replay protection, rollback, crash recovery and independently reviewed receipts
- removal of failed candidates without affecting old source

## 6. Final cutover/rollback

Cutover only after read/write compatibility, discovery provider identity and
real PC/Fold6 owner-scoped data parity are independently proven. Tests on one
host DO NOT establish Windows/Android/iOS/macOS/Linux acceptance.

Keep original runtime and UI files read-only/pinned until all consumers
use the reviewed new source and creator explicitly approves a release digest.
Rollback is to restore original provider registration and original source pins;
never overwrite durable databases with an older snapshot just to change code.
