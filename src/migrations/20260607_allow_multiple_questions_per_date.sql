-- Allow multiple questions on the same date; pick one at random when serving.

alter table question_schedules
  drop constraint if exists question_schedules_scheduled_date_key;

alter table question_schedules
  drop constraint if exists question_schedules_question_date_key;

alter table question_schedules
  add constraint question_schedules_question_date_key unique (question_id, scheduled_date);

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
