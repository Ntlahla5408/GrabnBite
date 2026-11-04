# Restaurant partner onboarding infrastructure

This guide covers the external configuration required by the restaurant application upload and banking features.

## 1. Supabase Storage bucket

Create a **private** Storage bucket named:

`grabnbite-restaurant-documents`

Recommended bucket settings:

- Public bucket: disabled
- Maximum file size: 10 MB
- Allowed MIME types:
  - `application/pdf`
  - `image/jpeg`
  - `image/png`
  - `image/webp`

The backend uploads and deletes objects with the existing Supabase service-role credential. The mobile app never receives that credential. Document downloads use signed URLs that expire after 15 minutes.

The new bucket is separate from the existing `grabnbite-policies` bucket. Do not make the restaurant-document bucket public.

The backend reads the project URL and service-role key from the existing `SupabaseStorage:ProjectUrl` and `SupabaseStorage:ServiceRoleKey` settings. The bucket name defaults to `grabnbite-restaurant-documents`; it can be overridden with `SupabaseRestaurantDocumentStorage:BucketName`.

No database-table RLS changes are required for this storage integration. Keep the existing 18 public tables' RLS settings as they are.

## 2. Banking encryption key

Bank account numbers are encrypted with AES-256-GCM before being written to PostgreSQL. Generate one 32-byte key in PowerShell:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$key = [Convert]::ToBase64String($bytes)
$rng.Dispose()
$key
```

Store the generated value in the Render backend service as the environment variable:

```text
RestaurantBankingEncryption__Key
```

For local development, set the same value using User Secrets from the backend project directory:

```powershell
dotnet user-secrets set "RestaurantBankingEncryption:Key" "<generated-base64-key>"
```

Do not put this key in `appsettings.json`, source control, mobile configuration, or chat. Keep a secure backup. If the key is lost, existing encrypted account numbers cannot be decrypted. Do not rotate it after banking details have been stored unless a controlled re-encryption process is performed.

## 3. Database migration

The restaurant partner onboarding EF migration is intentionally not applied by this feature. The new application, document, banking, agreement, review, history, operating-hours and commission tables do not exist in the production database until the migration is explicitly reviewed and applied.

Do not test the new database endpoints against production before the migration has been applied through the agreed deployment process.


## Brevo transactional email configuration

The backend now includes a server-side Brevo transactional email client. It sends through Brevo's REST API and does not require a separate NuGet package.

Before enabling OTP delivery:

1. Verify `primenaturesolutions@gmail.com` as a sender in Brevo.
2. Create a Brevo API key in the Brevo account.
3. Configure these backend settings in Render:

   - `Brevo__ApiKey` — the Brevo API key (secret).
   - `Brevo__SenderEmail` — `primenaturesolutions@gmail.com`.
   - `Brevo__SenderName` — `GrabnBite`.

4. Configure the same values locally with .NET user-secrets:

   ```powershell
   dotnet user-secrets set "Brevo:ApiKey" "<brevo-api-key>"
   dotnet user-secrets set "Brevo:SenderEmail" "primenaturesolutions@gmail.com"
   dotnet user-secrets set "Brevo:SenderName" "GrabnBite"
   ```

Never commit the API key, place it in appsettings files, or expose it to the mobile application. The sender address must be verified in Brevo before sending production email.

The email client is infrastructure only at this stage. OTP generation, challenge storage, verification endpoints, login enforcement, and mobile verification screens have not yet been implemented.
