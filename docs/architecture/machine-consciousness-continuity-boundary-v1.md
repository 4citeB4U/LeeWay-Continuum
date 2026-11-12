# Machine Consciousness ↔ Continuum boundary

Canonical map: [Machine Consciousness cross-repository integration v1](https://github.com/4citeB4U/Machine-Consciousness/blob/main/docs/architecture/leeway-cross-repository-integration-v1.md).

Continuum is the durable state and continuity authority. It receives receipt-backed state, checkpoints, replay records, and learning references through an authorized adapter, then performs a real readback. It is not Formula, Veritas, Receipt Authority, Model Hub, or a permission broker.

Required states remain explicit: `NOT_WRITTEN`, `WRITE_PENDING`, `WRITE_CONFIRMED`, `READBACK_CONFIRMED`, and `READBACK_FAILED`. A local file write or in-memory simulation cannot be reported as Continuum admission.
