-- Replace anon-only RLS policies with permissive policies for all roles.

drop policy if exists "Allow anonymous select" on questions;
drop policy if exists "Allow anonymous insert" on questions;
drop policy if exists "Allow anonymous update" on questions;
drop policy if exists "Allow anonymous delete" on questions;

create policy "Allow all select on questions" on questions
  for select
  to public
  using (true);

create policy "Allow all insert on questions" on questions
  for insert
  to public
  with check (true);

create policy "Allow all update on questions" on questions
  for update
  to public
  using (true)
  with check (true);

create policy "Allow all delete on questions" on questions
  for delete
  to public
  using (true);

drop policy if exists "Allow anonymous select responses" on responses;
drop policy if exists "Allow anonymous insert responses" on responses;

create policy "Allow all select on responses" on responses
  for select
  to public
  using (true);

create policy "Allow all insert on responses" on responses
  for insert
  to public
  with check (true);

create policy "Allow all update on responses" on responses
  for update
  to public
  using (true)
  with check (true);

create policy "Allow all delete on responses" on responses
  for delete
  to public
  using (true);
