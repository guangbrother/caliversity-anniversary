-- Run this entire script in Supabase Dashboard > SQL Editor > New query.
-- Public board: anyone with the URL can read and submit. No service_role key is used in the browser.

create table if not exists public.anniversary_items (
  id uuid primary key default gen_random_uuid(),
  member_name text not null check (char_length(member_name) between 1 and 40),
  item_name text not null check (char_length(item_name) between 1 and 90),
  category text check (category is null or category in ('Calisthenic gear','Tech','Food & Beverages','Other(s)')),
  media_url text,
  media_type text check (media_type is null or media_type in ('image','video')),
  created_at timestamptz not null default now()
);

alter table public.anniversary_items enable row level security;

drop policy if exists "Anyone can view anniversary items" on public.anniversary_items;
create policy "Anyone can view anniversary items"
on public.anniversary_items for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can submit anniversary items" on public.anniversary_items;
create policy "Anyone can submit anniversary items"
on public.anniversary_items for insert
to anon, authenticated
with check (
  char_length(member_name) between 1 and 40
  and char_length(item_name) between 1 and 90
  and (category is null or category in ('Calisthenic gear','Tech','Food & Beverages','Other(s)'))
  and (media_type is null or media_type in ('image','video'))
);

-- Create a public bucket for the optional media.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'anniversary-media',
  'anniversary-media',
  true,
  26214400,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload anniversary media" on storage.objects;
create policy "Anyone can upload anniversary media"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'anniversary-media');

-- Note: anonymous uploads are public. For a public event board, only share media people
-- are comfortable making public. Add moderation, CAPTCHA and rate limits before using
-- this pattern for a large or abuse-prone public audience.
