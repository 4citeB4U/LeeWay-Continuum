<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.LICENSES
TAG: LEEWAY.CONTINUUM.THIRD_PARTY_NOTICES.V1
WHO: LeeWay Industries
WHAT: Preserve original bundled UI dependency provenance.
WHEN: 2026-10-26
WHERE: LeeWay-Continuum/THIRD_PARTY_NOTICES.md
WHY: Do not silently relicense copied creator-approved and upstream source.
HOW: Refer to original bundle and license documentation before public release.
AUTHORITY: LICENSE INVENTORY ONLY, NOT LEGAL APPROVAL.
LICENSE: MIT for this document.
-->
# Third-party notices and release review

The original Continuum UI contains bundled:
- DOMPurify, documented in Runtime Fabric CURVED_HIERARCHY_RELEASE.md as
  version 3.4.16, Apache-2.0 / MPL-2.0. Keep existing bundled notices and
  ensure license text is included for binary/public redistribution.
- Mammoth, documented as version 1.13.0, BSD-2-Clause. Keep original notices
  and license text in any publication.

Original source bytes are mirrored unchanged. Do not replace either script
from CDN, upgrade dependencies, or rewrite vendor source while migrating.
Inspect original upstream licenses and embedded headers before public release.

SQLite is public-domain software; DuckDB is MIT; PouchDB is Apache-2.0.
Review the exact installed Electric/PostgreSQL versions and their license
notices before redistributing clients or server binaries; none are bundled
in this repository seed. Cloud service use is governed by each current account
plan and provider agreement; this source package itself grants no free quota.

New LeeWay adapter files are MIT-licensed unless otherwise marked.
Existing creator-authored Runtime and original UI files retain existing source terms.
