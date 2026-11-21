<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.RECOVERY.GITHUB_FREE.SCIENTIFIC_QUALIFICATION
TAG: LEEWAY.CONTINUUM.GITHUB.CPU_RECOVERY.FREE_MODE.V1
5WH:
WHAT = Test GitHub-hosted CPU for bounded Continuum source/recovery development and packaging; reject unauthorized always-on computing.
WHY = Preserve user independence and portable state without claiming GitHub Actions is a private production runtime.
WHO = Creator / LeeWay Continuum source owner; outside support contributor, not Agent Lee.
WHERE = docs/research/GITHUB-FREE-CONTINUUM-RECOVERY-V1.md.
WHEN = 2026-11-21.
HOW = Original owner-scoped local-storage adapter; isolated GitHub CI runners; signed-or-hashed package validation; public synthetic evidence only.
LICENSE = MIT.
AUTHORITY = DRAFT SOURCE AND CI RESEARCH; NOT PRODUCTION CONTINUUM, AGENT LEE, VERITAS OR PROVIDER GRANT.
-->

# LeeWay Continuum: free GitHub CPU recovery and browser-extension continuity — bounded proof

## Creator's revised intent

**Not a 24-hour GitHub CPU server.** Use available no-cost GitHub-hosted CPU during permitted development/build/release/recovery qualification workflows. LeeWay's Formula-developed software GPU is CPU-executed and independent of the user's physical graphics GPU. Maintain versioned source, a verifiable recovery/bootstrap package and enough durable *authorized* state outside any one user device to reattach an enrolled browser extension or phone to one original Continuum/Runtime.

The ultimate experience is: a fresh Chrome/Edge/Safari client installs a thin native/browser component, authenticates to the same owner, enrolls the device, receives a recovery/Continuum reconnect plan, and then attaches to the original host-provided CPU execution environment and LeeWay GPU software world. **This source test does not deliver that entire live experience.** It tests the recoverable package/identity and crypto/integrity boundaries one step at a time.

## Legality/free/operational reality — verified primary GitHub documentation, November 21, 2026

GitHub Actions permitted scope: development, testing, deployment and publication of *the repository's software*. Current Additional Product Terms, effective 2026-08-27, explicitly disallow Actions as an application's serverless backend or content delivery network, or workloads unrelated to the repository's project software development. See https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features.

- **YES, GitHub CPU for source work:** Standard GitHub-hosted Linux runners on **public repos** remain free. This repo is public. Existing Continuum CI already runs source tests on hosted CPU. https://docs.github.com/en/billing/concepts/product-billing/github-actions
- **YES, transient test artifact:** Source/synthetic recovery fixture may be passed from one GitHub Actions job to another; artifacts have retention/billing limits. Here the artifact is 65,536 bytes plus a tiny manifest and expires in **one day**. Do not use it as an enduring database/archive.
- **NO, product compute server:** Do not turn a web extension or the actual production Runtime Fabric into an API that dispatches arbitrary customer file processing onto GitHub Actions. That would be serverless application back-end behavior, not repository software qualification.
- **NO, private memory in public repository:** GitHub Pages publicly serves static assets, not private authenticated Continuum records and not a long-running CPU server. GitHub Releases may hold approved versioned software packages/manifest evidence; original Continuum source expressly forbids general live database storage there.
- **NO guaranteed percentage:** Neither GitHub Actions nor a free provider supplies a verified 99% uptime/recovery commitment here. Uptime, sync latency, owner retrieval and tenant security are separate acceptance metrics, not inferred from CI PASS.
- **NO implied free external hosting:** Account-level GitHub billing/current artifact/storage settings must be checked before expanding usage; this public-source CI uses standard Linux runners only, no paid large runner or private-repo quota claim. Existing service host (Render/Railway etc.) may have separate limits.

## Existing original architecture to reuse (never clone)

- Continuum authority: \`src/authority/continuum-authority.mjs\` owns \`leeway.continuum\`.
- Exact body-scoped local durability: \`src/storage/owner-local-storage.mjs\`, bound through original authorizer.
- OIDC-derived reconnect: \`src/identity/continuum-account-binding.mjs\` and \`docs/PORTABLE-ACCOUNT-CONTINUITY-CONTRACT.md\` (canonical owner identity, body enrollment, integrity, replica negotiation).
- Existing production injection: \`src/integration/canonical-host-binding.mjs\`; any real deployment requires source-qualified host and original Runtime/Device Bridge.
- Other approved recovery providers: \`docs/storage/PROVIDER-ONBOARDING-AND-RECOVERY.md\`. GitHub Releases = versioned packages, not live DB.
- Existing browser/Safari UI: the original Device Bridge Safari Web Extension; Chrome/Edge extension surfaces remain separate scoped clients, not providers of independent CPU capacity.
- Formula/CPU scientific work: \`Leeway-formula-live\` draft PR #26 documents retained PC hardware, CPU execution tests and eight mathematical hardware bridges. No physical host graphics-GPU requirement.

## Actual permitted source integration experiment

Workflow: \`.github/workflows/github-free-recovery-qualification.yml\`. Every job uses actual standard \`ubuntu-latest\` CPU, five-minute job timeout, repository contents **read** permission, and one-day artifact retention. No uploaded secrets, user IDs, device files, phone photos, live Continuum DB, GitHub Deployments or live application service.

Job 1 (source CPU, synthetic Android body):
1. Runs tests on unchanged original owner-local storage plus the new bounded drill.
2. Opens original \`openOwnerLocalStorage\` on a temporary directory scoped to **synthetic owner/source body** with only fixture capabilities.
3. Writes 64 KiB deterministic **explicitly synthetic public bytes**, reads them back, compares SHA256 and exact content.
4. Emits a JSON test-only manifest with exact digest, byte count, synthetic owner/body scopes and \`CI_TRANSIENT_ARTIFACT_NOT_CONTINUUM\`.
5. Publishes only \`fixture.bin\` and \`manifest.json\` as a transient GitHub Actions test artifact with \`retention-days: 1\`.

Job 2 (different real CPU runner, synthetic iPhone body):
1. Downloads that same-run synthetic test artifact, checks schema, owner/body identity, bytes and SHA256 before any target write.
2. Reopens original \`openOwnerLocalStorage\` with **the same synthetic owner and a different synthetic body scope** in a clean ephemeral directory; writes and reads back the exact content.
3. Probes wrong-owner read and asserts failure \`CONTINUUM_LOCAL_ACCESS_DENIED\`.
4. Reports status \`TARGET_JOB_RESTORED\` with \`productionQualified:false\`; the original canonical owner writer is not created or changed.

Negative source tests: tamper bytes, tamper owner/body manifest, forge deployed service status, and test original wrong-owner/tenant denial. Never treat a source-test-owned fixture authorizer as real OIDC authentication.

**The original Repo's local Continuum storage implementation is the real code under test.** A passing run proves a software portability drill and two execution CPU jobs, not live phone-to-phone transfer or independent durable owner-memory custody. The jobs are ephemeral and do not restore a real account.

## Future extension and device operational shape — owner review required

\`\`\`text
Native/browser Safari, Chrome, Edge thin client
              |
        verified OIDC owner
              |
     original Device Bridge admission
              |
    original Continuum account binding
      /                    \
offline device copy      available approved host Runtime
      |                    |
device-local Brain       same original Formula software GPU on available CPU/RAM
      \                    /
       owner-scoped verified checkpoint
              |
  approved private durable storage/replica
              |
    authenticated new device reconnect
\`\`\`

GitHub participates at the **software source/build/release/restore testing** lane, not as that private tenant CPU service or as the durable identity/Continuum owner. On-demand production calculations run on an **authorized host CPU**, which may be the user's current device or a separate real server with adequate resources. A device changing or going offline must not result in an impersonated second Agent Lee or unauthorized replica writer.

When a browser extension can reach only GitHub Pages, it may render the static LeeWay Tablet and explain an unavailable runtime, or show consent-based offline functionality. It cannot manufacture live CPU service solely because a GitHub-hosted CI runner was previously successful. The eventual signed release/source manifest can bootstrap an approved client, but active private Continuum sync and processing require separately qualified original runtime paths and private storage.

## GitHub Copilot and device-compatibility workflow — Creator's continuation

**Source-of-truth versus device authority.** GitHub holds versioned source, signed/hashed release manifests, CI results and reviewed portable recovery packages. It does not directly own or enumerate the USB peripherals physically attached to the Creator's Windows PC. Device Bridge, the OS, iOS app and Android app retain the real device-to-device transport, consent and native API authority. Original Continuum retains owner-scoped state and its durable approved storage. This works as GitHub-coordinated development and qualification, not an alternative device network or production remote filesystem.

**Android to Apple in this PR:** CI fixtures now use the existing `createContinuumAccountBinding()` for one *synthetic* OIDC issuer/subject across two distinct bodies, `ci-android-body` and `ci-apple-body`. The owner-derived scope is exactly the same; body IDs remain distinct. The transferred 64 KiB is `OWNER_SCOPED_CONTINUUM_CONTENT_ONLY`. Original Android Digital Brain remains device-local; native iPhone Digital Brain must be newly initialized from Apple-supported observations. A source manifest claiming an alternate target platform, false service deployment or different owner/body is rejected. No real login took place; the fixture's `identityVerified:true` is test input, not authentication evidence.

**GitHub's testable role:**
- Standard Linux/Windows/macOS hosted CI: portable Formula, Continuum and extension source tests, compatible library builds and release checks. CI platform names do not imply direct physical USB access.
- Optional emulators/simulators: Android and iOS app build/simulation validation when runner image/dependencies allow; simulator SUCCESS never qualifies a physical Samsung Fold6 or iPhone 11.
- Original local VS Code Copilot + authenticated Device Bridge: physical ADB/Apple lockdown app lifecycle, identity, owner-authorized native Diagnostics/Continuum readback, USB connect/reconnect, real Formula CPU measurements and runtime error receipt references.
- GitHub Copilot code review/coding agent: independently inspect source/CI diffs and propose patches, **only if the actual Copilot plan and AI credit allowance make the action no-cost under Creator's free-only instruction**. Official GitHub docs (as of 2026-11-21) describe cloud agent access as paid-plan dependent since 2026-10-28 and AI credits consumed for coding-agent operations. Do not auto-request premium Copilot sessions or purchase credits. Free GitHub Actions CPU does **not** make Copilot's LLM inference free.

**Security: no public-repository self-hosted runner on the Creator's PC.** GitHub warns that a self-hosted runner attached to a public repository can execute untrusted PR code with machine access. Do not expose private host USB devices, user files or owner credentials through untrusted Actions workflows. A future separately approved protected ephemeral runner or read-only mediated Bridge testing path requires explicit owner authorization, correctly scoped repository trust, and independent refusal tests. No such runner is installed by this PR.

**Actual owner-device cross-platform acceptance (separate from CI):** A verified owner signs in to an Android client; original Continuum writes approved portable state to authorized private durability; the same owner signs in on iPhone; the iPhone receives a distinct approved Device Bridge enrollment and fresh native Digital Brain; original Continuum reads back the exact scoped portable bytes; owner mismatch fails; independent receipt custody is reconciled; a permitted Formula CPU task can resume with its original workId. These steps remain NOT_EXECUTED by the GitHub CI drill. Original live dual-phone evidence and outstanding MCP admission are in [Device Bridge draft PR #128](https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE/pull/128).

**Primary references:** https://docs.github.com/en/actions/reference/security/secure-use; https://docs.github.com/en/actions/reference/runners/self-hosted-runners; https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-on-github; https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing; https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features.

## Independent acceptance and scientific falsification

| Gate | Expected outcome | Status at source design |
| --- | --- | --- |
| GH-FREE-01 | Current terms and public-standard-runner zero-cost eligibility reviewed | PRIMARY DOC REVIEWED; ACCOUNT BILLING SETTINGS NOT_PROBED |
| GH-FREE-02 | Original Continuum local source passes existing owner-storage tests | NEW PR CI PENDING |
| GH-FREE-03 | Two different GitHub Actions jobs exchange exact synthetic bytes | NEW PR CI PENDING |
| GH-FREE-04 | Wrong-owner, tampered data, forged service claim denied | NEW PR CI PENDING |
| GH-FREE-05 | No actual private data, long-running worker or production GitHub Actions API | DESIGN ASSERTED; NO EXTERNAL NETWORK PROBE |
| GH-FREE-06 | Repeat workflow under source upgrade with recorded digest | REPEATABILITY NOT_YET_RUN |
| GH-FREE-07 | Original owner account/device/Continuum real native reconnect | NOT_EXECUTED |
| GH-FREE-08 | Real authorized host CPU runs Formula software GPU after reconnect | NOT_EXECUTED |
| GH-FREE-09 | Owner-scoped durable private store survives all user devices offline | NOT_EXECUTED |
| GH-FREE-10 | Independent Veritas, Receipt, Learning and production handoff | NOT_EXECUTED |

**FOR:** Original Continuum local storage already supports owner/body-scoped content-addressed \`put/get\`, SHA-256 readback and a device-independent authority identifier. Public standard GitHub CI has real CPU, and its legitimate software testing use is free according to GitHub docs.

**AGAINST:** GitHub Actions is short-lived, terms forbid converting it into the customer runtime, artifacts expire, public repo is not private data custody, and existing Continuum account/provider integrations are not production-certified. Even with passing two-runner tests, uptime and true cross-device persistence remain unproven.

## Roles, risk, rollback and evidence

No local devices, GPU drivers, USB ports, employee identity, provider credentials, or original SQLite/Continuum record indexes are touched. No new model, user data archive, task queue, data plane, database, or receipt issuer is introduced. Rollback consists only of discarding this draft source branch; the existing Continuum host and prior tests continue unchanged.

Exact commit and CI job/report links are added to the PR after actual GitHub execution. This source document must not be updated to PASS solely from a hypothetical workflow. Any failure counts as evidence AGAINST and requires repair and retest; independent acceptance remains with original owners.

Mission continues from original Continuum issue #1 and the ongoing GPU/Formula/Device Bridge continuity chain, not a new operating-world project.
