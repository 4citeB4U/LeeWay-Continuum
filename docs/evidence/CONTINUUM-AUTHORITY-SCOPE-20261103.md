# Continuum Authority/Scope Repair — 2026-11-03

## Investigate

Canonical repository: `4citeB4U/LeeWay-Continuum`.

Baseline: `db538ded86cd066eef675b577bf713a2d0bcbb06`.

The repository already described Continuum as the logical data authority, but its source descriptors and capacity contracts exposed `ownerId` and `bodyId` without a distinct deployment-independent authority field. That made a live body label such as `pc-primary` easy to misread as the owner of Continuum.

## Diagnose

The defect was contract ambiguity, not evidence that a new database or authority should be created. A device, OS, GitHub repository, process, storage engine, or body is a scope/location. It is not the Continuum authority.

GitHub is the canonical source and release surface. It is not treated as a persistent database runtime. Qualified self-hosted Continuum deployments may place subordinate storage on different bodies while retaining the same logical authority reference.

## Implement

- Added `src/authority/continuum-authority.mjs` with the existing capability reference `leeway.continuum` and deployment-independent authority mode.
- Added authority metadata to engine adapters, catalogs, canonical host binding, ecosystem consumers, cloud archives, read-only Brain projection, storage readiness, capacity proposals, and governed compartment reservations.
- Enforced that device, OS, repository, and storage labels cannot replace `leeway.continuum`.
- Kept `ownerId` and `bodyId` as explicit access/placement scope only.
- Updated topology and production-lock documentation to state the boundary.
- Added negative and positive source tests.

No runtime process, owner store, credential, database, replication channel, or production deployment was changed.

## Test / validate

- `npm test`: 85 passed, 0 failed.
- `npm run check:syntax`: passed.
- `git diff --check`: passed.
- Authority negative tests reject `pc-primary`, `phone-fold6`, `windows`, `android`, `github`, and storage resource labels as authority references.
- Pull request #10: https://github.com/4citeB4U/LeeWay-Continuum/pull/10.
- Remote source-only CI for commit `69508a5698ec15accc36ada517871e88231808c8` passed on Linux, Windows, and macOS: https://github.com/4citeB4U/LeeWay-Continuum/actions/runs/41585080653.

## Observed host boundary

The existing PC carrier was inspected read-only and was not restarted or mutated during this repair. Its previously loaded runtime still reports `ownerId=pc-primary` and `bodyId=pc-primary`; those values are retained as body-local access/placement scope, not as the Continuum authority. The running source file hashes observed at inspection were:

- `machine-consciousness/carrier-server.mjs`: `8131B7AF76E8488E8CCE19E16B041C269AD1CC7F9AB9F5B73FFEDF14C4902D24`
- `machine-consciousness/pc-continuum.mjs`: `86D316AA9BED82C0F6C7ACD587DC1BF1A3C61B79322D4B9BE07680181533DF04`

The repaired source is therefore source- and CI-qualified, but is not yet runtime-observed on that carrier. Activation requires the approved restart workflow and a fresh authenticated readback.

## Remaining live gates

- The running PC service must be restarted only through the approved workflow before this source contract can become active there.
- Fold6-local Continuum must be independently readback-qualified.
- Formula exact-byte condensation/reconstruction, capacity measurement, governed compartment expansion, interruption recovery, Veritas PRE/POST, Receipt Authority, and Learning Ledger admission remain live gates.

## Evidence state

`SOURCE_VERIFIED`: yes. `CI_VERIFIED`: local suite yes; remote Linux/Windows/macOS source-only CI yes. `RUNTIME_OBSERVED`: existing PC Continuum remains observed under the prior source; repaired contract not loaded. `INDEPENDENTLY_VERIFIED`: pending. `PRODUCTION_ACCEPTED`: no.

`RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.`
