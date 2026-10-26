<!-- LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.PRODUCTION_LOCK
TAG: LEEWAY.STORAGE.LOCK_IN_ACCEPTANCE_V1
5WH: WHAT=Release evidence law; WHY=Prevent premature production claims; WHO=LeeWay creator authority; WHERE=docs/storage; WHEN=2026-10-25; HOW=fail-closed explicit gates.
AUTHORITY: Candidate contract only. LICENSE: Existing repository terms.
-->
# Production Lock Acceptance — Universal Continuum Storage

**"Lock it in" means:** creator signoff on a specified, tested release; source commit, contracts, policies, codecs, schemas and receipts pinned and versioned. No source change or passing test alone establishes production readiness. Changes after lock require a new version and requalification.

## Mandatory verified evidence before PRODUCTION_ACCEPTED

- [ ] Each new Agent Lee installs with a separate authenticated owner, Continuum namespace, Digital Brain and databases; no creator computer is required.
- [ ] All durable application and Digital Brain reads/writes pass through Continuum, not direct engine access.
- [ ] Exact Formula codec reconstruction and integrity, tampering, corruption, compression and byte-cost measurements pass.
- [ ] Cross-owner read/write denial, key separation, device credentials and export/import authorization pass.
- [ ] SQLite local persistence, online backup, restart, crash recovery and backward-compatible legacy reads pass.
- [ ] Actual Digital Brain state—not merely fixtures—is persisted and restored through Continuum.
- [ ] Optional DuckDB/PouchDB projections rebuild safely; their absence does not block core function.
- [ ] LDWMD remains fast, separate VRAM authority; only approved durable checkpoints go through Continuum.
- [ ] Tested physical Windows, macOS, Linux, Android, iOS and browser/PWA adapter results are recorded individually.
- [ ] Two independently enrolled devices synchronize offline revisions, conflicts, idempotency and tombstones with exact recovery.
- [ ] Real independent Veritas PRE/POST, Formula authority when required, Receipt Ledger and Learning Ledger admission established.
- [ ] Versioned artifacts, license review, supply-chain audit, rollback and rollback rehearsal complete.
- [ ] Creator explicitly approves release digest and evidence vault; immutable production tag generated.

## Current evidence boundary

Formula codec and candidate adapter merged at c367ae73f09a64802462f7c23f17b8dbaa9411d3. Real original Continuum service, adapter, restart and receipt tests succeeded under TEST_ONLY. Two isolated owner fixtures recovered their records after restart and rejected cross-owner reads (TEST_ONLY). This **does not** qualify user provisioning, encryption, device migration, the actual Digital Brain, production admissions, Google storage or multi-device sync.

**CURRENT STATE: NOT LOCKED / NOT PRODUCTION ACCEPTED.**

## Required release record

Release ID; exact commit and schema hashes; owner policy and binding hashes; codec version; per-device test report, original/reconstructed SHA-256, independent receipts, platform license and deployment matrix, rollback evidence, named limitations and creator signoff.
