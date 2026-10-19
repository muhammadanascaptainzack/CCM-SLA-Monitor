# Security Specification: Citrus Pvt Ltd Complaint Portal (Firestore)

## 1. Data Invariants
1. **Strict PII & Account Privacy**: A customer profile in `/users/{userId}` can ONLY be read (`get`), created, or updated by the authenticated owner whose `request.auth.uid == userId` (or a verified administrator). No customer can ever list or read another customer's profile.
2. **Complaint Ownership & History Privacy**: A complaint in `/complaints/{complaintId}` must have `ownerUid == request.auth.uid` on creation, and can ONLY be read (`get` or `list`) by the authenticated customer whose `request.auth.uid == resource.data.ownerUid` (or a verified administrator).
3. **Immutable Identity & Creation Timestamp**: `ownerUid` and `createdAt` can never be mutated on update.
4. **Temporal Integrity**: `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. **Terminal State Locking**: Once a complaint reaches `status == 'CLOSED'`, non-admin users cannot mutate it further.
6. **Verified Email Mandate**: All writes require `request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing on Customer Profile**: Authenticated user `uid_A` creates `/users/uid_A` with `ownerUid: "uid_B"`. -> `PERMISSION_DENIED`
2. **Cross-Customer Profile Read (PII Leak)**: Authenticated user `uid_A` attempts `get` on `/users/uid_B`. -> `PERMISSION_DENIED`
3. **Customer Profile Enumeration (`list`)**: Authenticated user `uid_A` attempts `list` on `/users`. -> `PERMISSION_DENIED`
4. **Shadow Field Injection on Profile**: Authenticated user `uid_A` creates `/users/uid_A` with an undeclared field `isAdmin: true`. -> `PERMISSION_DENIED`
5. **Unverified Email Write**: Authenticated user `uid_A` with `email_verified: false` attempts to create `/users/uid_A`. -> `PERMISSION_DENIED`
6. **Cross-Customer Complaint Read**: Authenticated user `uid_A` attempts `get` on `/complaints/tkt_1` where `ownerUid == "uid_B"`. -> `PERMISSION_DENIED`
7. **Unfiltered Complaint List Query**: Authenticated user `uid_A` attempts to `list` `/complaints` without filtering `ownerUid == "uid_A"`. -> `PERMISSION_DENIED`
8. **Complaint Ownership Hijack on Update**: Authenticated user `uid_A` updates `/complaints/tkt_1` changing `ownerUid` to `"uid_B"`. -> `PERMISSION_DENIED`
9. **Client Timestamp Forgery**: Authenticated user `uid_A` creates `/complaints/tkt_1` with a forged past/future `createdAt` != `request.time`. -> `PERMISSION_DENIED`
10. **Oversized String Resource Exhaustion (DoW)**: Authenticated user `uid_A` submits a 5,000-character `description` (exceeding maxLength 1500). -> `PERMISSION_DENIED`
11. **Terminal State Bypass**: Authenticated user `uid_A` attempts to update a complaint whose existing `status` is `'CLOSED'`. -> `PERMISSION_DENIED`
12. **Self-Admin Escalation**: Authenticated user `uid_A` attempts to write to `/admins/uid_A` without being the bootstrapped verified admin. -> `PERMISSION_DENIED`
