-- レート制限用（IP はハッシュのみ保存）
alter table public.comments add column if not exists ip_hash text;

create index if not exists comments_user_created_idx
  on public.comments (user_id, created_at desc)
  where user_id is not null;

create index if not exists comments_ip_hash_created_idx
  on public.comments (ip_hash, created_at desc)
  where ip_hash is not null;