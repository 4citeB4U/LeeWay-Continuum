<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.CANONICAL.SOURCE_COMPLETION
TAG: LEEWAY.CONTINUUM.FULL_SOURCE_TRANSFER.GATE.V1
WHO: LeeWay Industries / Leonard Jerome Lee
WHAT: Boundary, inventory and acceptance evidence for full canonical Continuum source ownership.
WHEN: 2026-10-27
WHERE: docs/FULL-SOURCE-COMPLETION-GATE.md
WHY: Repository content is real but does not yet contain the exact original owner storage implementation.
HOW: Pin every transferred source identity, retain original runtime until verified cutover.
AUTHORITY: SOURCE AUDIT / NO PROD CUTOVER / NO PRIVATE DATA PUBLICATION.
LICENSE: MIT
-->
# LeeWay Continuum — Complete-source migration gate

## Meaning of 100% Continuum
This repository is the intended owner of **Continuum-authored source code, interfaces, original visual assets, tests, packaging, contracts, and deployment instructions**. It is not the owner of independent upstream engines (SQLite, DuckDB, PouchDB, Electric/PostgreSQL), external applications, Formula implementation, Runtime Fabric governance, LDWMD/GPU memory allocation, or Agent Lee native window manager. Those are dependencies consumed via approved contracts, not files to duplicate or rival authorities.

The publicly visible Git repository must never contain owner databases, journals/WAL, personal records, Pocket ID private stores, credentials, private keys, owner-specific receipts or encrypted archives that would expose private identity/data. Runtime-owned data remains in owner-controlled stores and migrates only via a separately qualified, authorized procedure.

## Confirmed and still-unresolved inventory (2026-10-27)
| Continuum element | Current location | Evidence state | Required action |
|---|---|---|---|
| Original UI HTML, CSS, sphere, depth, media and vendor assets | `ui/original/` | Copied source, Git blob provenance in `docs/SOURCE-PROVENANCE.md` | Protect exact byte identity in tests; physical host acceptance still required |
| Runtime original HTTP routes and read-only Brain provider | `compat/runtime-fabric/` | Git blob-mirrored source | Keep transitional caller compatibility; test authenticated owner binding |
| Device Bridge owner/snapshot binder | `compat/device-bridge/` | Source mirrored from separate owning component | Preserve source for Continuum compatibility; actual Bridge remains an external client |
| Existing canonical service injection | `src/integration/canonical-host-binding.mjs` | Source adapter only | Prove live service instance and provenance; fail closed |
| Owner-local `pc-continuum.mjs` original service | Reported at owner PC under `pc-consciousness-live/runtime/machine-consciousness/` | **BLOCKED**: exact live module not recovered from GitHub | Read-only owner-host discovery, SHA-256, original runtime relation, authorized transfer |
| Owner-local `owner-retention.mjs` original retention | Reported in original owner PC Continuum folder | **BLOCKED**: exact live module not recovered from GitHub | Same provenance, authorization, dependence and test gates |
| Full canonical service factory and database schema/migrations | Original live host, not independently inspected | **BLOCKED** | Inventory real source, dependency closure and migrations; do not invent |
| Four storage-engine adapters | `src/adapters/` | Source candidate, real optional providers unbound | Qualify owner authorization, real engine health, boundaries and failure behavior |
| Cloud archive adapters | `src/storage/` | Source candidate; no live credential/bucket | Verify encryption, restore, quotas and grant without committing private data |
| Capacity planner | `src/capacity/` | Proposal and fixture tests only | Independent admission before actual provisioning |
| Original floating widget contract | `widget/continuum-widget.contract.json` | Source contract | Native Golden Package controls overlay; physical parity is not proven |
| Pages entrypoint | `index.html` | Root now redirects to unchanged original UI | Observe deployment and verify visual asset loading; Pages does not host the owner API |
| Continuous integration | `.github/workflows/continuum-tests.yml` | Linux/Windows/macOS source tests passed before gate change | Add byte-parity/Pages structure checks; physical C3 remains separate |

## Procedure for original owner-host source transfer
1. Freeze the **source revision** for audit purposes without stopping production; identify the live binary/process/provider registration, runtime command, original module imports, owner/body scope and immutable data store location by read-only inspection.
2. Run `pwsh -File scripts/Inspect-ContinuumAuthority.ps1 -LeeWayRoot <LEEWAY_ROOT>` on the authorized original PC. The placeholder denotes the resolved root; there is no hard-coded drive identity. This detects candidates and SHA-256 only. Candidate filenames are **not proof** of canon.
3. Independently prove each candidate is the exact source loaded by the original owner service, resolve dependency closure, confirm source licenses/classification, and remove only secrets from source **without changing behavior**, with reviewed evidence of that change.
4. Transfer the exact authorized source files (not SQLite/WAL/keys/receipts) to an isolated source branch. Preserve source SHA-256 and destination SHA-256 plus a manifest. Never create a duplicate writable service or rename an unrelated Brain projection to Continuum.
5. Parse/check imports, syntax/test original service and run restart/restore on non-owner fixtures; prove lossless canonical record bytes before and after. Maintain rollback to original provider and source pins without overwriting durable data.
6. Run real owner-scoped read-only status/readback first. Only allow writes after original issuer/capability and Veritas PRE/POST, authentic Receipt Ledger and Learning Ledger bindings admit a *live* governed execution. Prove denial for cross-owner and unapproved operations.
7. Test real PC + Fold6 first; individually qualify other platforms rather than extrapolating Node CI. Creator signs the version-pinned acceptance record; only then may the existing production provider cut over.

## Static GitHub Pages truth
GitHub Pages **can** show the preserved HTML/CSS/Canvas interface but does not provide a local trusted service at `/api/continuum`, authenticated personal records, owner grants, native frameless overlay geometry, or the Golden Package window manager. A disconnected sphere is not evidence of data loss. Do not commit fixture documents or fake occupancy to disguise an unbound service.

## C3 acceptance: not yet passed
A complete governed path must be observed:
Agent Lee ingress → Runtime Fabric → independent Veritas PRE → Harness → actual Formula when applicable → registered Continuum capability → **original real service** → durable exact readback → independent Veritas POST → canonical Receipt Ledger → Learning Ledger.

Required identifiers: release commit, source SHA-256, schema/version hashes, owner approval, real provider ID, actual process proof, request/trace, pre/post evidence, receipt hash/chain and rollback test. The source audit itself is not a receipt or a Learning Ledger event.

**STATE: PARTIAL SOURCE OWNERSHIP VERIFIED; ORIGINAL OWNER SERVICE TRANSFER BLOCKED BY LACK OF LIVE HOST SOURCE ACCESS. PRODUCTION CUTOVER NOT AUTHORIZED.**
