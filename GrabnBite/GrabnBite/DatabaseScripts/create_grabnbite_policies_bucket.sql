-- GrabnBite policy PDFs are customer-facing legal documents.
-- The bucket is public for READ access only. Upload and delete operations
-- must be performed by the ASP.NET Core API using the Supabase service-role key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'grabnbite-policies',
    'grabnbite-policies',
    true,
    10485760,
    array['application/pdf']::text[]
)
on conflict (id) do nothing;
