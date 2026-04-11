create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  category text not null,
  response text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table responses enable row level security;

create policy "Allow anonymous select responses" on responses
  for select
  to public
  using (auth.role() = 'anon');

create policy "Allow anonymous insert responses" on responses
  for insert
  to public
  with check (auth.role() = 'anon');
