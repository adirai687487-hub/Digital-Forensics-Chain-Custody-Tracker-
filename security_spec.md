# Security Specification & Test Protocol

## 1. Data Invariants
1. **Identity & Ownership Invariant**: An evidence record, custody transfer event, or verification log cannot be created unless `ownerUid` strictly matches the authenticated user (`request.auth.uid`).
2. **Immutable Forensic Identifiers**: An evidence item's `id`, `originalHash`, and `ownerUid` can never be modified after creation.
3. **Append-Only Custody Ledger**: Custody events can never be edited or deleted once written; the chain is strictly append-only.
4. **Valid Cryptographic Hash Constraints**: Hashes must be strictly 64 characters long and conform to hexadecimal characters (`^[0-9a-fA-F]{64}$`).
5. **PII and Evidence Isolation**: Users can only read and list evidence items, custody events, and verification logs where `resource.data.ownerUid == request.auth.uid` (or if the user is a designated administrator).
6. **Default-Deny Catch-All**: Any unspecified collections or paths are blocked.

---

## 2. The "Dirty Dozen" Threat Payloads

1. **Payload 1 (Unauthenticated Write)**: Write to `/evidence/EVD-999` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Payload 2 (Owner Spoofing on Create)**: Authenticated as `user_alice`, attempting to insert `ownerUid: "user_bob"` -> `PERMISSION_DENIED`.
3. **Payload 3 (Hash Mutation Attack)**: Attempting to update `originalHash` of an existing evidence item -> `PERMISSION_DENIED`.
4. **Payload 4 (Ghost Field / Shadow Update)**: Updating an evidence document with injected key `isBypassed: true` not in allowed schema -> `PERMISSION_DENIED`.
5. **Payload 5 (Custody Event Deletion Attack)**: Calling `deleteDoc` on `/custody_events/EVT-001` -> `PERMISSION_DENIED`.
6. **Payload 6 (Custody Event Alteration Attack)**: Calling `updateDoc` to alter `toInvestigator` or `hashAtEvent` on past custody event -> `PERMISSION_DENIED`.
7. **Payload 7 (Invalid SHA-256 Format)**: Creating an evidence record with a 20-character invalid hash string -> `PERMISSION_DENIED`.
8. **Payload 8 (Unauthorized Cross-User Read)**: `user_alice` querying evidence documents belonging to `user_bob` -> `PERMISSION_DENIED`.
9. **Payload 9 (ID Poisoning Attack)**: Injecting a 2KB string as document ID -> `PERMISSION_DENIED`.
10. **Payload 10 (Verification Log Tampering)**: Modifying a verification record from `TAMPERED` to `VERIFIED` after generation -> `PERMISSION_DENIED`.
11. **Payload 11 (Blanket Collection Scraping)**: Attempting an unrestricted `list` query without restricting to `ownerUid` -> `PERMISSION_DENIED`.
12. **Payload 12 (Unauthorized Admin Role Escalation)**: Regular user writing an admin entry into `/admins/` -> `PERMISSION_DENIED`.
