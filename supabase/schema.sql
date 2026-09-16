-- YOUSI v1.6 Schema
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  content text not null,
  created_at timestamp with time zone default now()
);
alter table messages enable row level security;
create policy "Allow all" on messages for all using (true) with check (true);
-- Realtime
alter publication supabase_realtime add table messages;
