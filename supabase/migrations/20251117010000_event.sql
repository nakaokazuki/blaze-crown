create type public.event_submission_kind as enum (
  'mission_1',
  'mission_2',
  'mission_3',
  'bonus_battle'
);

create type public.event_submission_status as enum ('pending', 'approved', 'rejected');

create table public.event_profiles (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 32),
  x_handle text,
  game_id text,
  assigned_char_a text not null,
  assigned_char_b text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_slug, user_id)
);

create index event_profiles_slug_idx on public.event_profiles (event_slug);

create table public.event_submissions (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind public.event_submission_kind not null,
  storage_path text not null,
  content_hash text not null,
  status public.event_submission_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index event_submissions_slug_status_idx on public.event_submissions (event_slug, status, created_at desc);
create index event_submissions_user_idx on public.event_submissions (event_slug, user_id, created_at desc);

-- 同一ユーザーが同じ画像（ハッシュ）を再提出できない
create unique index event_submissions_user_hash_unique
  on public.event_submissions (event_slug, user_id, content_hash);

alter table public.event_profiles enable row level security;
alter table public.event_submissions enable row level security;

grant select, insert, update, delete on table public.event_profiles to service_role;
grant select, insert, update, delete on table public.event_submissions to service_role;

-- 非公開ストレージバケット（service role でアップロード）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-submissions',
  'event-submissions',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;