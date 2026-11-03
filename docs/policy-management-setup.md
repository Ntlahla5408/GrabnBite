# GrabnBite policy management setup

## Architecture

- Policy metadata is stored in the existing PostgreSQL database through EF Core.
- PDF files are stored in the Supabase Storage bucket `grabnbite-policies`.
- The ASP.NET Core API is the only component that uploads or removes policy files.
- Customer endpoints return only published, non-archived policies whose effective date has arrived.
- Admin endpoints require the existing JWT `Admin` role.

The bucket is public for reading because these are customer-facing legal documents. Do not upload private, confidential, or customer-specific files to this bucket. Public access does not grant permission to upload or delete objects.

## Supabase Storage configuration

The `grabnbite-policies` bucket has been provisioned in the connected Supabase project with:
- Public read access
- PDF-only allowed MIME type
- 10 MiB maximum file size

The bucket provisioning SQL is also kept in `GrabnBite/GrabnBite/DatabaseScripts/create_grabnbite_policies_bucket.sql`.

## Backend environment variables

Configure these values in the ASP.NET Core hosting environment (Render for production):

| Environment variable | Value |
|---|---|
| `SupabaseStorage__ProjectUrl` | `https://ocungxgvvuutjpvaytgw.supabase.co` |
| `SupabaseStorage__ServiceRoleKey` | Supabase service-role key from the project's API settings |
| `SupabaseStorage__BucketName` | `grabnbite-policies` |
| `SupabaseStorage__MaxFileSizeBytes` | `10485760` |

Never put the service-role key in the mobile app, source control, or an `EXPO_PUBLIC_*` variable. It belongs only in the backend host's secret environment variables.

## Database migration

From the backend project directory (`GrabnBite/GrabnBite`), apply the EF Core migration:

```powershell
dotnet ef database update
```

The migration is named `20261103210000_AddPolicyDocuments`. Do not deploy the API code before this migration has been applied to the target database.

## API routes

### Public customer routes

- `GET /api/Policies` — published policies currently in effect.
- `GET /api/Policies/{policyDocumentId}` — one published policy currently in effect.

### Administrator routes

- `GET /api/Policies/admin` — all non-archived policies, including drafts.
- `POST /api/Policies` — create a policy (multipart form with `Title`, `Description`, `Status`, optional `EffectiveDate`, and required `PdfFile`).
- `PUT /api/Policies/{policyDocumentId}` — update metadata and optionally replace the PDF.
- `DELETE /api/Policies/{policyDocumentId}` — archive the policy without destroying its audit record or stored document.

PDF uploads are validated by extension, PDF file signature, and configured size limit. Replacing a PDF increments the policy version and removes the previous storage object after the database update succeeds.
