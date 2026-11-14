# Portable account continuity contract

Continuum and Device Bridge use the same verified OIDC account identity: the identity provider’s normalized issuer plus stable subject. An email address is a login handle and may change; it is not the custody key, storage path, or replica identity.

On every newly installed device, the product flow is:

`install → login → verified account subject → Device Bridge enrollment → Continuum reconnect plan → canonical readback → approved replica negotiation`

The account maps to one opaque Continuum owner scope across every authorized device. Each device retains its own body scope and device-held key. This means a replacement phone or computer joins the same account without asking the customer to recreate private profile data.

No plan is a readback. The canonical Continuum provider must still verify the authenticated account, device enrollment, owner index, replica permission, and integrity before private records are exposed or synchronized.

If paid remote/hosted LeeWay service pauses, customer-held local Continuum data remains preserved, readable, and exportable. The system may pause remote replication and hosted Bridge service; it may not delete, ransom-encrypt, confiscate, or reassign the customer’s Digital Brain, Continuum, or Diagnostics.
