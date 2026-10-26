<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.REPOSITORY
TAG: LEEWAY.CONTINUUM.CANONICAL.REPOSITORY.V1
WHO: LeeWay Industries / Leonard Jerome Lee
WHAT: Dedicated source home for existing Continuum authority, original UI and scoped adapters.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/README.md
WHY: Independent lifecycle without duplicating production data or identity.
HOW: Preserve source; inject original host; qualify optional engines and providers.
AUTHORITY: SOURCE REPOSITORY ONLY; no production deployment, grants or live data migration.
LICENSE: MIT for new files; original module licenses and vendor notices are preserved.
-->
# LeeWay Continuum

**One canonical Continuum authority, multiple replaceable databases and optional storage compartments.**

**Canonical independent source repository:** https://github.com/4citeB4U/LeeWay-Continuum

**STATUS: PUBLISHED SOURCE REPOSITORY. LIVE PRODUCTION INTEGRATION NOT YET QUALIFIED.**

The GitHub repository is currently **PUBLIC** by the repository owner's choice. It contains source and documentation only; never publish live databases, credentials, owner records, Pocket ID identity stores, or encrypted archives that carry private identity data without an explicit access review.

The original owner storage reported at 127.0.0.1:8890 remains unchanged. No live records,
identity keys, Receipt Ledger, Learning Ledger, or Veritas authorities have been moved.

## Preserved source

- ui/original/: byte-mirrored honeycomb sphere, HTML/CSS, hierarchy, interaction, media
  scripts and bundled dependencies. Do not replace with a mock, screenshot, new design, or iframe.
- compat/runtime-fabric/: mirrored original Continuum HTTP routes and existing Brain READ_ONLY projection.
- src/integration/canonical-host-binding.mjs: explicit original service injection; no auto-created database.
- src/capacity/: original capacity proposal from Runtime Fabric PR #89, with its fixture tests.
- widget/continuum-widget.contract.json: stable SPATIAL capability for the existing Agent Lee Golden Package host.

The actual original owner-authorized Continuum service is reported in local PC modules.
Those modules were not found at the same paths on Runtime Fabric default branch.
They must be reconciled by source pin and trusted owner access before activation.

## Four database technologies

| Engine | Role | Actual connection state (source repository) |
|---|---|---|
| SQLite | Canonical durable records; original owner storage | Existing runtime reported; code adapter is injected, NOT a new DB |
| DuckDB | Derived analytics and query projections | Adapter source only, no qualified database connection |
| PouchDB | Device/browser offline replica, eventual outbox | Adapter source only, no qualified live synchronization |
| Electric + PostgreSQL | Optional cross-device synchronization | Adapter source only, no qualified PostgreSQL host |

The database engines remain their own upstream open-source packages. They are not
vendored here, and they must not be confused with a canonical Continuum owner instance.

## Three optional cloud storage compartments

| Service | Role | Status |
|---|---|---|
| Cloudflare R2 | Encrypted object backup | Host S3 client, credentials, quota and bucket UNBOUND |
| Oracle OCI Object Storage | Independent encrypted recovery objects | Host client, credentials, quota and bucket UNBOUND |
| GitHub Releases | Release packages and small encrypted release evidence | Manifest only; NOT general live database storage |

Cloud providers never become additional authorities for the live records.
No credentials, plaintext backups or private source content belong in GitHub.

## Source map

- src/adapters/engine-adapters.mjs — four owner-governed injected database engine roles
- src/storage/cloud-archives.mjs — encryption-required R2/OCI archived chunks and hash readback
- src/integration/canonical-host-binding.mjs — same-instance provider/owner source integration
- src/integration/ecosystem-consumer.mjs — scoped clients for the remaining LeeWay services
- compat/device-bridge/ — original Device Bridge binder and Pocket ID snapshot adapter
- src/capacity/continuum-capacity-plan.mjs — measured pressure, proposal only
- config/storage-topology.candidate.json — truthful unbound and optional states
- docs/SOURCE-PROVENANCE.md — original Git blob identity inventory
- docs/storage/ — merged four-engine architecture and production-release acceptance requirements
- docs/data-fabric/ — original database authority and federation contracts (reference copies)
- docs/EXTRACTION-AND-CUTOVER.md — transfer, validation, rollback and adoption process

## Synthetic test commands

Requires Node.js 22+.

    npm test
    npm run check:syntax

Passing these tests is NOT physical Windows/Android/iOS qualification, R2/OCI service access,
independent signer/Veritas proof, or two-device replication.

## Authority boundaries

- Do not create a second canonical Continuum when connecting this repository.
- Do not commit databases, WAL files, secrets, owner receipts or backups.
- Do not treat visual honeycomb occupancy as provisioned database shards.
- LDWMD retains separate working memory and GPU/VRAM lease authority.
- Use the existing Runtime Fabric Discovery, Device Bridge and Agent Lee native host.
- Never expose local owner Continuum HTTP directly to the public network.
