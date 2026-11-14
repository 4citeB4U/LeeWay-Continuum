# Offline peer Continuum contract

## Intent

Continuum gives one verified owner a unified custody view across their enrolled
devices while keeping every Digital Brain device-local. Internet access is not a
precondition for the owner's local records or for a nearby, mutually authenticated
peer transfer.

## Route selection

After verified owner identity and independent source/target enrollment, the route
order is fixed:

1. `OFFLINE_DIRECT_PEER` — a nearby adapter reports an available, mutually
   authenticated, encrypted link. The physical medium is adapter-specific: USB,
   Bluetooth, Wi-Fi Direct, local discovery, or another qualified local carrier.
2. `LAN_DIRECT_PEER` — a local-network adapter reports the same security state.
3. `INTERNET_RELAY` — only when a relay adapter reports the same security state.
4. `LOCAL_JOURNAL_ONLY` — no route is accepted. The local encrypted content and
   a durable change record remain available; reconciliation waits for a later
   qualified route.

A device label, IP address, Wi-Fi association, relay login, or claim from a peer
is never enrollment proof. A route planner does not establish a connection,
transfer bytes, or prove either endpoint received data.

## Change custody

The offline journal records owner-scoped metadata: originating device, sequence,
logical entry identifier, operation, content digest, operation identifier and
timestamp. The content itself remains in a caller-owned encrypted local store.
Every journal append must receive exact durable readback before it is reported as
accepted. A later reconciliation service must preserve tombstones, prevent replay,
and independently verify content before changing the unified owner index.

## Current source boundary

`src/sync/offline-peer-transfer.mjs` is a portable source contract with injected
transport and durable-journal adapters. It is not a deployed Bluetooth/Wi-Fi/USB
stack, device discovery implementation, cryptographic session implementation,
canonical index writer, Receipt Authority client, or physical multi-device test.
Those remain separate acceptance gates.
