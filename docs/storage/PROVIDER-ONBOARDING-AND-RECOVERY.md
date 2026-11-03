# Continuum provider onboarding and recovery contract

This is a source contract, not a claim that any provider is currently connected.

## Authority boundary

`leeway.continuum` remains the deployment-independent logical authority. A Google account, MEGA account, R2 bucket, OCI bucket, GitHub repository, device partition, or provider token is a subordinate resource or scope. No provider may mint Continuum authority, replace Formula, or become a second canonical writer.

## Provider roles

| Provider | Allowed role | Current source state |
| --- | --- | --- |
| Local Continuum binding | Canonical owner-scoped records and offline operation | Existing provider reported; fresh activation/readback required |
| Cloudflare R2 | Encrypted recovery/object archive | Adapter source; credentials and bucket unbound |
| Oracle OCI Object Storage | Encrypted recovery/object archive | Adapter source; credentials and bucket unbound |
| Google Drive | User-linked object store after OAuth consent | Candidate catalog only; no OAuth client or token in source |
| MEGA, pCloud, Box | User-linked object store after provider-native authorization | Candidate catalog only; provider adapter and account binding unqualified |
| Icedrive, Internxt | Candidate user-linked store | Contract/provider discovery required before implementation |
| GitHub Releases | Versioned source packages, manifests and bounded encrypted release evidence | Manifest contract only; not live private storage |

## Onboarding rules

1. The user authorizes a provider in its own consent flow. Continuum never asks for or hashes a provider password.
2. Tokens are held by the approved host vault or provider session adapter. They never enter source, logs, receipts, worker assignments or public Git history.
3. The adapter records provider identity, owner/body scope, resource ID, granted scope, quota observation, revision and last readback without exposing token material.
4. Every write enters the Continuum Formula and admission path first. Exact original-byte recovery is required; summaries and condensed projections are not substitutes for the source object.
5. A provider is not accepted until upload, download, corruption refusal, quota/limit handling, revoke/reconnect, offline queue recovery, duplicate idempotency and independent readback pass.

## Capacity and recovery

Capacity pressure may produce a bounded proposal. It does not create an account, bucket, folder or “free” storage automatically. Provisioning requires an owner-approved resource, budget/quota, reservation, single-writer fencing, Veritas PRE/POST, readback, canonical receipt and recovery evidence. Provider quotas and free tiers are discovered at runtime and must never be hard-coded as guaranteed capacity.

The canonical local Continuum scope remains usable offline. Remote providers are synchronization/archive targets; a remote outage must produce a truthful queued or blocked state and must not erase local durable data.

## Current gate

The provider catalog and policy tests are source-level only. Google Drive, MEGA, pCloud, Box, Icedrive, Internxt, R2 and OCI remain unbound in this branch. No user account was accessed, no credential was generated, and no provider write was attempted.
