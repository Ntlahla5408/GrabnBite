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

The restaurant partner onboarding, Yoco idempotency and email-verification migrations were reviewed and applied to the Supabase production database on 4 November 2026. The onboarding tables, supporting indexes and email-verification columns were verified after deployment.

Do not reapply these migrations. Do not enable or change database Row Level Security as part of this workflow; the existing table-level RLS configuration remains unchanged. Future schema changes must be generated, reviewed and explicitly approved before application.


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

## Email verification OTP configuration

New public registrations require email verification before login. Existing accounts are marked verified by the migration default so current customers, restaurants, drivers and administrators are not locked out.

The backend uses a cryptographically generated six-digit code. Only an HMAC-SHA256 hash is stored in PostgreSQL. Codes expire after 10 minutes, verification is limited to five incorrect attempts per code, resends have a 60-second cooldown, and no more than five resends are allowed in a rolling hour.

Generate a separate 32-byte OTP pepper in PowerShell:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$pepper = [Convert]::ToBase64String($bytes)
$rng.Dispose()
$pepper
```

Add the generated value to the Render backend service as:

```text
EmailVerification__OtpPepper
```

For local development, use .NET User Secrets:

```powershell
dotnet user-secrets set "EmailVerification:OtpPepper" "<generated-base64-key>"
```

Use a different key from the banking encryption key. Do not commit it, put it in appsettings files, or expose it to the mobile application. Back it up securely; changing or losing it prevents outstanding verification codes from being validated.

The API endpoints are:

- `POST /api/Authentication/verify-email`
- `POST /api/Authentication/resend-verification`

The login endpoint refuses to issue a JWT until a new account's email is verified. The mobile registration flow opens the verification screen automatically.


## 4. Restaurant application submission and review

The applicant saves their application draft and supporting documents before using:

- `POST /api/RestaurantApplication/{id}/submit`

Submission is validated server-side. The current required items are:
- Verified applicant email.
- Business identity and contact details.
- Authorised representative details and authority confirmation.
- At least one fulfilment method and one open operating day.
- Acceptance of the published commission offer.
- CIPC certificate, food premises certificate, identity/authority document and bank confirmation.
- Encrypted payout banking details.

Administrator-only review endpoints are exposed through `/api/AdminRestaurantApplication`:
- `GET /` and `GET /{id}` list and inspect applications.
- `PUT /{id}/documents/{documentId}/review` approve or reject an uploaded document.
- `PUT /{id}/banking/review` verify or reject payout details.
- `PUT /{id}/under-verification`, `PUT /{id}/request-documents`, and `PUT /{id}/reject` record review decisions.
- `POST /{id}/approve` creates the operational restaurant profile and its commission schedule after all required documents and banking details have been approved.

Only approved and active operational restaurants are returned by the public restaurant listing. Approval activates the restaurant with ordering closed initially; the restaurant owner must open it when ready to accept orders. No database migration is required for these workflow endpoints.
