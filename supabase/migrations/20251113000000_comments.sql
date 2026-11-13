create type public.comment_status as enum ('pending', 'approved', 'rejected');

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  guest_name text,
  body text not null check (char_length(body) <= 2000),
  status public.comment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index comments_article_id_idx on public.comments (article_id);
create index comments_status_idx on public.comments (status);

alter table public.comments enable row level security;

create policy "Anyone can read approved comments"
  on public.comments
  for select
  using (status = 'approved');

-- INSERT / UPDATE / DELETE は service role（API）経由のみ
