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

The restaurant partner onboarding EF migration remains unapplied. The email-verification schema changes also require a new EF migration generated locally after pulling the branch.

Review both pending migrations together before applying them. They must not be applied automatically at application startup, and no production database changes are made by this feature branch. Do not test the new onboarding or email-verification database endpoints against production until the migrations have been explicitly reviewed and applied through the agreed deployment process.


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
