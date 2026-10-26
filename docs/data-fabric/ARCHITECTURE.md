# LeeWay Data Fabric Architecture

## Position in LeeWay

LeeWay Standards
→ Governance / Veritas
→ Runtime Fabric
→ Agent Lee
→ LeeWay Harness
→ LeeWay Data Fabric
→ domain authorities

The LeeWay Data Fabric is a Runtime Fabric subsystem.

It is not a replacement brain.
It is not above LeeWay Standards.
It is not a second Runtime Fabric.
It does not replace the LeeWay Harness.

## Core law

ONE LIVE LEEWAY DATA EXPERIENCE DOES NOT MEAN ONE PHYSICAL DATABASE.

Each data domain has one proven canonical authority.

Federation, synchronization, caches, projections, indexes, replicas and
catalogs do not become authority merely because they can see or copy data.

## Component roles

### Apache Gravitino

Role:
- metadata catalog
- data discovery
- governance metadata
- model metadata
- asset registry

Authority:
- metadata plane only
- NOT application-domain authority

### Trino

Role:
- federated query
- cross-source read surface
- data virtualization

Authority:
- query plane only
- no autonomous write authority

### Apache SeaTunnel

Role:
- approved bulk movement
- incremental synchronization
- CDC movement
- database-to-database transfer

Authority:
- movement plane only

A moved copy remains subordinate to the source authority unless a separate
governance process explicitly changes authority.

### Apache Arrow / ADBC

Role:
- efficient in-memory columnar representation
- low-conversion database access
- high-efficiency data interchange

Authority:
- none

### Arrow Flight

Role:
- high-speed node-to-node bulk data transport

Authority:
- none

### CDC / Event Lane

Small real-time changes should move as events rather than repeated full-data
copies.

Initial CDC implementation belongs to SeaTunnel where technically suitable.

### Apache Pulsar

Pulsar remains OPTIONAL.

It may be introduced only if measured LeeWay event volume, delivery
requirements and resource evidence justify a dedicated broker.

## Data lanes

DISCOVER
→ Gravitino

QUERY
→ Trino

MOVE / SYNCHRONIZE
→ SeaTunnel

TRANSFER LARGE DATA FAST
→ Arrow / ADBC / Flight

LIVE CHANGE
→ CDC
→ event fabric

## Security-owned and application-owned stores

Bitwarden must not become a general federated SQL catalog.

Forgejo state-changing operations use Forgejo service/API semantics.

n8n state-changing operations use n8n service/API semantics.

Core LeeWay SQLite stores remain behind controlled LeeWay adapters until
their exact authority and reader/writer contracts are proven.

## Formula

The canonical LeeWay Formula is unchanged.

Transport telemetry may be observed and later supplied to an approved
controller.

No new Phi meanings are created by this Data Fabric implementation.

Operational Q69/QB64 representation remains distinct from Base64 0–63
spatial/address representation.

## Evidence flow

mission
→ Harness
→ governed data request
→ Data Fabric
→ domain authority
→ result
→ Veritas
→ receipt / ledger
→ learning
→ Digital Brain

## Digital Brain

The Data Fabric must eventually appear live in the Digital Brain with:

- databases
- domains
- authorities
- catalogs
- models
- connectors
- transfers
- CDC events
- failures
- resource telemetry
- provenance
- Veritas status
- receipts
- change history

A source file or update packet alone does not prove live Brain ingestion.
