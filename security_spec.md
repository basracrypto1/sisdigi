# Security Specification for SISDIGI

## Data Invariants
- A citizen document must have a valid NIK (16 digits).
- A letter must belong to the user who created it (using `uid` field).
- Document IDs must be alphanumeric.

## The Dirty Dozen Payloads (Rejection Targets)
1. Creating a citizen with a 1MB name.
2. Updating a letter's `id` after creation.
3. Writing to someone else's citizen record.
4. Creating a letter with a future `createdAt`.
5. Anonymous write access.
6. Citizen record without a NIK.
7. Letter without a nomorSurat.
8. Injection of script tags into `nama` field.
9. Modifying `updatedAt` to a client-controlled timestamp.
10. Reading all citizen records without being authenticated.
11. Deleting a letter that belongs to another user.
12. Creating a document with a non-string `id`.

## Test Runner (Logic Overview)
The `firestore.rules` will be tested to ensure that:
- `request.auth != null` is required for all ops.
- `isValidCitizen()` and `isValidLetter()` helpers enforce schema.
- Ownership is checked via `userId` or `ownerId` fields.
