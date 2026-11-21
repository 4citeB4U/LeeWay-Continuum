<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.RELEASE.CROSS_DEVICE.VOICE
TAG: LEEWAY.CONTINUUM.DEVICE_REJOIN_AND_VOICE.PHYSICAL_ACCEPTANCE.V1
5WH:
WHAT = Define the executable vertical slice and exact real-device production acceptance for Continuum recovery and Agent Lee speech.
WHY = Source CI green is insufficient; one original Runtime/Device Bridge/Continuum owner must produce real native and audio readback.
WHO = Creator / original Continuum, Runtime, Device Bridge, Voice Fabric and Agent Lee owners; Local VS Code Copilot is the physical tester; outside assistant is not Agent Lee.
WHERE = docs/qualification/CONTINUUM_DEVICE_REJOIN_PRODUCTION_GATES_V1.md.
WHEN = 2026-11-21.
HOW = Bind existing adapter functions, exercise original local HTTP device-rejoin, enforce owner/grant and bytes readback; voice.status/speak plus actual speaker confirmation.
LICENSE = MIT under existing source repository terms.
AUTHORITY = DEPLOYMENT_AND_PRODUCTION_CHECKLIST. Source changes cannot issue owner consent, Runtime leases, independent Veritas or Receipt Authority admission.
-->

# Production release gates — same LeeWay agent, original Continuum, real cross-device recovery and audible voice

## Canonical owner and mission

Continue original [Continuum issue #1](https://github.com/4citeB4U/LeeWay-Continuum/issues/1), [Continuum draft PR #15](https://github.com/4citeB4U/LeeWay-Continuum/pull/15), [Device Bridge draft PR #128](https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE/pull/128), and [Formula draft PR #26](https://github.com/4citeB4U/Leeway-formula-live/pull/26). Do not create another Agent Lee, Formula, GPU, Device Bridge, Runtime scheduler, Veritas, Receipt Authority or Continuum writer.

**User experience:** On an authenticated enrolled Android, Apple, Windows or Linux device, the owner can reattach to the *same* Continuum owner scope; the native device initializes its own Digital Brain/Diagnostics; approved portable Continuum records are transferred and read back exactly; the original available CPU host runs Formula/Agent Lee work; the original Voice Fabric speaks to an authorized physical speaker. A new phone does **not** need to download the whole GPU/model workspace. GitHub CI supports code and bounded source recovery qualification, not the live owner CPU server.

## New real executable source integration in this PR

- \`src/integration/device-rejoin-handoff.mjs\`: bounded \`createContinuumDeviceRejoinHandoff\`. This is an original-host **dependency injection seam**, not a new server or database. It requires authenticated owner callback, real Device Bridge enrollment, original Runtime work grant/lease epoch, original Continuum provider \`getContent\`, actual Device Bridge stage and target readback. Exact bytes/SHA enforced. Input is a single explicitly scoped record, capped at 4 MiB for this vertical slice. Failures after staging require reconciliation; a stage ACK is not a successful restore.
- \`compat/runtime-fabric/continuum-routes.mjs\`: original existing local server gets optional \`POST /api/continuum/device-rejoin\`, disabled if the original host does not inject a \`deviceRejoin\` implementation. Same-origin loopback owner request marker, six permitted metadata fields, and original provider owner-context matching required. Never accepts source data, self-proclaimed owner ID, password or unsigned session JSON from the browser.
- \`src/identity/continuum-account-binding.mjs\` and \`src/integration/canonical-host-binding.mjs\`: pre-existing original owner OIDC scope and canonical provider binding are reused unchanged. No second SQLite writer.
- Tests use original bounded storage and provider methods with temporary synthetic data, including owner spoof, invalid native passport, missing/stale lease, wrong byte digest, stage/readback failure, extra browser parameters, wrong origin and unbound host.

**Boundary:** Injected callbacks represent real host APIs that **must be wired by the original Runtime/Device Bridge**. Their declared results in unit tests are not native evidence. This pull request alone does not perform device registration, real account verification, speaker playback or production service deployment.

## Physical commissioning — Local VS Code Copilot, not cloud runner

1. **Preserve and qualify the original branch and source:** recover latest protected original Runtime, Bridge, Continuum, Formula and Voice Fabric source SHAs, local dirty changes, authentic owner consent and approved operations. Resolve existing VS Code MCP \`DEVICE_BRIDGE_SOURCE_HASH_MISMATCH:apps/desktop/mcp-server.mjs\` without disabling/weakening the source integrity gate. Verify \`tools/list\` after authentic local MCP restart.
2. **Bind original runtime device-rejoin API:** use approved original OIDC validator for \`authenticateOwner\`; original Device Bridge enrollment readback for \`enrollDevice\`; original Runtime work lease/fencing and grant for \`authorizeRestore\`; original running Continuum owner service (source SHA and body) for \`resolveOriginalContinuum\`; existing native Device Bridge stage and readback for \`stageDeviceContent\` and \`readbackDeviceContent\`. Do **not** substitute mocks or create another writer.
3. **Exercise real owner-controlled content:** on original source device, select a small *non-sensitive approved portable test record*, confirm source SHA, use original service to stage to an enrolled second body, and verify target bytes/hash plus source/recovery receipts. Require separate target Digital Brain and Diagnostics; never transfer Android hardware state to iOS.
4. **Verify read-only and denied operations:** wrong owner/issuer/subject, stale work lease, expired native enrollment, forged target result, duplicate workId, interrupted stage, corrupted bytes, revoked device and offline reconnect. An attempted stage with uncertain poststate must request reconciliation; do not silently retry a non-idempotent write.
5. **Reconcile original continuity and cross-device UX:** original Continuum owner index must read back; Device Bridge/native extension must authenticate through the same account and original Runtime. Check actual Chrome/Edge/Safari native/extension installation separately where each platform permits. Web UI showing "connected" is not evidence of storage or native execution.
6. **Voice-first physical milestone:** existing \`LEEWAY-DEVICE-BRIDGE/apps/desktop/voice-fabric-adapter.mjs\` already exposes \`voice.status\` (original \`/health\` and \`/voice/binding\`) and \`voice.speak\` (original \`/render-voice\`); it currently returns \`playbackVerified:false\`. Use *the existing original Voice Fabric package and approved output device*, then actually play a short consented diagnostic phrase on the Creator's PC. Verify output device selected, returned audio format/bytes, playback action result and **human audible acknowledgment** or independently authorized loopback capture. Do not equate a synthesized base64 result with sound heard. Do not create another voice engine or imitate Agent Lee via an unapproved provider.
7. **Release gates:** independently verify original Formula call/CPU work, Runtime grant, native bridge device, real audio playback, canonical Continuum readback, independent Veritas PRE/POST, original Receipt Authority evidence, eligible Learning and owner-approved deployment, with a rollback/restart test. Preserve source CI and negative evidence; release only original owner-approved exact commits.

## Distinct outcomes to record

| Gate | Current actual proof | Required promotion |
| --- | --- | --- |
| Source Continuum API integration | Module/route implemented in this draft PR; source CI passing at tested revisions | Bind actual original Runtime callbacks to deployed host |
| GitHub CPU/source portability | Two actual GitHub Actions runner jobs passed synthetic same-owner/different-body SHA test | Not a live user backend; retain as CI qualification |
| Original primary PC | Device Bridge health/identity source-bound; historical OEM/CPU records exist | Current live original Continuum and CPU/PCIe execution |
| Fold6 | Local ADB and app launch observed by Local Copilot | Authenticated device enrollment + Continuum native readback |
| iPhone 11 | Lockdown/native app/DVT screenshot observed by Local Copilot | Authenticated native iOS bridge and Continuum readback |
| Original Voice Fabric | Source \`VoiceFabricAdapter.status/speak\` exists, PC grants discovered | Live synthesis, speaker output and audible confirmation |
| Connected extensions | Original Safari source exists; Chrome/Edge proposed binding | Real native/extension login, enrollment, actual record recovery |
| Veritas / Receipt / Learning | Not executed for this new flow | Original independent custody, no synthetic endorsements |
| Production | This branch is draft and unmerged | Exact SHA owner-approved deployment with readback/rollback |

**Current status:** END_TO_END_SOURCE_PATH_IMPLEMENTED_WITH_INJECTED_BOUNDARIES / ORIGINAL_NATIVE_HOST_CALLBACKS_NOT_CONNECTED / LIVE_VOICE_PLAYBACK_NOT_EXECUTED / PRODUCTION_NOT_QUALIFIED.

## Source publication and next checkpoint

GitHub SHA and current CI log must accompany original PR #15. Original Device Bridge PR #128 remains Local Copilot's physical source-of-truth handoff. Local Copilot must publish actual command/API outcomes, source hashes, and positive/negative evidence in original issue/PR; no credential or private content in public GitHub. Do not add a self-hosted Actions runner to the public repository just to gain physical USB access. Keep the user device and local Continuum private. 
