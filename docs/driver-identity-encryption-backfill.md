# Driver identity encryption backfill runbook

This runbook applies only after the schema migration `20261105160000_EncryptDriverIdentityFields` has been applied and the matching application version has been deployed.

## Safety requirements

1. Take and verify a restorable database backup before changing existing identity data.
2. Confirm the encryption key configured at `RestaurantBankingEncryption:Key` is the existing 32-byte base64 key used for driver bank-account encryption. Do not rotate or replace it during this operation.
3. Apply pending EF migrations in order. The release branch currently includes:
   - `20261105120000_OneActiveDeliveryPerDriver`
   - `20261105150000_AddPolicyAudience`
   - `20261105160000_EncryptDriverIdentityFields`
4. Do not run the backfill against a database until the final migration is recorded in `__EFMigrationsHistory`.

## Dry run

Call the admin-only maintenance endpoint with an administrator bearer token:

```http
POST /api/AdminDriverApplication/maintenance/encrypt-legacy-identifiers
Authorization: Bearer <administrator-token>
```

The default is dry-run mode. It reports the number of application records checked, the number containing legacy identity values, and the number of fields that still need encryption. It does not modify records or return identity values.

The live database audit on 5 November 2026 found one approved driver application with all three legacy identity fields populated. After the schema migration, the expected dry-run result for that record is three pending fields. Recheck the actual result before proceeding; do not assume the count is unchanged.

## Execute the backfill

Only after reviewing the dry-run result and confirming the backup and encryption key:

```http
POST /api/AdminDriverApplication/maintenance/encrypt-legacy-identifiers?confirm=true
Authorization: Bearer <administrator-token>
```

The operation runs in a serializable transaction. It encrypts any missing encrypted value, verifies existing encrypted values can be decrypted with the configured key, clears the corresponding plaintext field only after a valid encrypted value exists, and records a non-sensitive application-history event. A failure rolls back the transaction.

## Post-operation verification

1. Repeat the dry-run call. It should report zero pending fields and zero applications containing legacy identity values.
2. Confirm the application still has all three encrypted values.
3. Confirm the applicant's own application response still supplies the values needed to edit their application.
4. Confirm the administrator response contains only the `...OnFile` indicators and never either plaintext or encrypted identity values.
5. Do not include identity values in logs, tickets, screenshots, or verification output.

## Rollback

Do not drop the encrypted columns or run a destructive migration rollback. The migration intentionally blocks a rollback that could delete values written only to encrypted columns. Use a reviewed forward migration or restore the verified backup under an approved recovery plan.
