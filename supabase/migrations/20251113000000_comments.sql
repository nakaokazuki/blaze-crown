create type public.comment_status as enum ('pending', 'approved', 'rejected');

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  guest_name text,
  body text not null check (char_length(body) <= 2000),
  status public.comment_status not null default 'approved',
  ip_hash text,
  created_at timestamptz not null default now()
);

create index comments_article_id_idx on public.comments (article_id);
create index comments_status_idx on public.comments (status);
create index comments_user_created_idx on public.comments (user_id, created_at desc)
  where user_id is not null;
create index comments_ip_hash_created_idx on public.comments (ip_hash, created_at desc)
  where ip_hash is not null;

alter table public.comments enable row level security;

create policy "Anyone can read approved comments"
  on public.comments
  for select
  using (status = 'approved');

-- Data API「新テーブルを自動公開」OFF 時は明示 GRANT が必要
grant select, insert, update, delete on table public.comments to service_role;
grant select on table public.comments to anon, authenticated;

-- INSERT / UPDATE / DELETE は service role（API）経由のみ
