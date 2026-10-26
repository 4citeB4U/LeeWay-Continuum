<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE_FEDERATION
TAG: LEEWAY.CONTINUUM.PER_PERSON_MULTI_DB.V1
5WH: WHAT = Device-neutral per-person multi-database integration contract.
WHY = Each Agent Lee owns a portable Digital Brain and accesses canonical records through Continuum only.
WHO = LeeWay Industries, creator-authorized candidate design.
WHERE = Leeway-formula-live/docs/storage/
WHEN = 2026-10-25
HOW = Scoped identities, Formula exact codecs, explicit engine adapters and verified projections.
AUTHORITY = DESIGN CANDIDATE ONLY; NO PRODUCTION ENROLLMENT.
LICENSE = Existing repository terms.
-->
# Per-person Continuum multi-database contract (candidate)

## Hard invariants
- Every Agent Lee installation has its own cryptographically scoped owner identity, Continuum namespace, Digital Brain record set, and device-local database files. **Never** share raw files or keys between unrelated owners.
- LeeWay applications, models, and Digital Brain read/write canonical durable information via Continuum service APIs; no application-specific bypass to SQLite, DuckDB, PouchDB, Google, or PostgreSQL.
- Continuum is the logical data authority and metadata/receipt gate. Storage engines are subordinate replaceable adapters, not independent knowledge sources.
- Formula's exact lossless codec handles content-addressed archive representations, while condensed/lossy mathematical summaries are separate explicitly labeled projections.
- Existing Continuum SQLite and legacy raw records remain unchanged; qualified new codecs are versioned and must prove byte-exact reconstruction before acceptance.
- LDWMD/VRAM Database handles transient tensor/device memory leases independently. Only selected durable checkpoint objects and their provenance go through Continuum, not every frame or allocator operation.
- Device/OS/LLM neutrality: no single Windows laptop, phone, GPU, database server, Google account, model, or provider is required for local functional operation.

## Storage roles
| Adapter | Role | Required per installation |
|---|---|---|
| SQLite | Core durable Continuum metadata, indexed records, receipts and Digital Brain checkpoints | Yes, where qualified |
| DuckDB | Optional derived analytics/search over scoped snapshots; not canonical writes | No |
| PouchDB | Optional offline browser/PWA replica or outbox behind Continuum; IndexedDB-backed on web | No |
| Electric sync + PostgreSQL | Optional user-controlled multi-device transport for qualified deployments; PostgreSQL infrastructure is not required for offline usage | No |
| LDWMD | Existing separate VRAM/working memory authority, with explicitly governed checkpoint handoff | Existing separate component |
| Google Drive | Optional disabled-by-default archival transport; not the primary database | No |

## Lifecycle
1. Provision distinct owner namespace, Digital Brain and Continuum storage on the device; maintain owner trust material separate from transferable data archives.
2. Admit every canonical write using existing Continuum authorization and provenance.
3. Formula segments/compresses according to actual content type and verifies exact byte recovery.
4. Commit to owner-scoped canonical SQLite through Continuum and retain receipts.
5. Publish versioned derived projections to optional DuckDB/PouchDB under the same owner scope and record revision; prevent direct authoritative writes.
6. Synchronize only through separately qualified, authenticated and authorized Continuum replication transports; versions, tombstones, conflicts and replay must be verified.
7. Digital Brain/Agent Lee retrieval requests Continuum; Continuum reads or reconstructs source from subordinate engines, verifies content identity and returns scoped records.
8. Backup/export via SQLite online backup or VACUUM INTO plus a versioned, encrypted and verifiable LeeWay bundle; never copy a live WAL database file in isolation.

## Acceptance gates
- Distinct test users have non-overlapping namespaces, content hashes/scopes and key material.
- Exact original record survives device-local restart, lossless archive export/import and out-of-order/tampered-object rejection.
- Every application retrieval goes through Continuum (instrumented enforcement), and direct canonical DB writes from applications are rejected.
- Optional analytics/search projections are rebuildable; stale derived data cannot override Continuum's record revisions.
- Conflict/tombstone/idempotency rules validated for optional replication on two physically independent devices.
- Platform qualification is recorded separately on Windows, Linux, macOS, Android, iOS and PWA; a single Node test is not universal device proof.
- No mandatory network dependency, Google costs, PostgreSQL service, or electric sync server.

**Status:** Architecture and boundary specification only. No additional engines installed, no cross-device rollout performed, no schema migration authorized and no physical sync proof claimed.
