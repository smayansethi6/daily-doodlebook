create table if not exists question_schedules (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  scheduled_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (question_id, scheduled_date)
);

create index if not exists question_schedules_scheduled_date_idx
  on question_schedules (scheduled_date);

alter table question_schedules enable row level security;

create policy "Allow all select on question_schedules" on question_schedules
  for select
  to public
  using (true);

create policy "Allow all insert on question_schedules" on question_schedules
  for insert
  to public
  with check (true);

create policy "Allow all update on question_schedules" on question_schedules
  for update
  to public
  using (true)
  with check (true);

create policy "Allow all delete on question_schedules" on question_schedules
  for delete
  to public
  using (true);

create or replace function get_daily_question(target_date date default current_date)
returns setof questions as $$
begin
  return query
    select q.*
    from questions q
    inner join question_schedules qs on qs.question_id = q.id
    where qs.scheduled_date = target_date
    order by random()
    limit 1;

  if found then
    return;
  end if;

  return query
    select * from questions order by random() limit 1;
end;
$$ language plpgsql stable;
