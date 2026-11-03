-- Policy PDFs are stored in a PRIVATE bucket. The ASP.NET Core API uses
-- the Supabase service-role key to upload/delete files and create short-lived
-- signed URLs for published documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'grabnbite-policies',
    'grabnbite-policies',
    false,
    10485760,
    array['application/pdf']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
