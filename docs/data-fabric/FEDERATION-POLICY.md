# LeeWay Federation Policy

## Initial posture

READ ONLY.

Trino federation is not allowed to create a second writer for an
application-owned or Runtime-owned domain.

## Phase 2 initial sources

Approved candidates:

- Seafile MariaDB:
  - ccnet_db
  - seafile_db
  - seahub_db

- SQL Server:
  - LeeWayTransitHub

## Exclusions

Not directly federated as generic writable SQL:

- Bitwarden
- Forgejo
- n8n
- core LeeWay SQLite authority candidates

## Mutation rule

State-changing work must use the owning service/capability unless a later
LeeWay governance decision explicitly authorizes another mechanism.

## Trace rule

Federated queries must eventually carry the LeeWay mission/trace identity
through the Harness and produce auditable evidence.
