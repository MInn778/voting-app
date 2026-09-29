-- Run once in the Neon dashboard: SQL Editor → paste → Run.
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  created_at timestamptz not null default now(),
  closes_at timestamptz not null default now() + interval '7 days'
);

create table if not exists options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  position integer not null,
  vote_count integer not null default 0
);

create index if not exists options_poll_id_idx on options (poll_id);
