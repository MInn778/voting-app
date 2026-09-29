-- v1.1: every Poll has a Closing Time (at most 7 days after creation).
-- Run once in the Neon dashboard: SQL Editor → paste → Run. Safe to run twice.
alter table polls add column if not exists closes_at timestamptz;

-- Existing Polls close 7 days after they were created (older ones become Closed right away).
update polls set closes_at = created_at + interval '7 days' where closes_at is null;

alter table polls alter column closes_at set not null;
-- The app always sets it; the default only keeps an older deployment's inserts working.
alter table polls alter column closes_at set default now() + interval '7 days';
