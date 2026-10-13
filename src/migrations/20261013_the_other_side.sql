-- The Other Side: stance, share consent, moderation, and the aggregate-only
-- read path. Raw response rows stop being readable from the browser; visitors
-- reach them through security-definer functions that return counts or a single
-- approved, consented excerpt.

alter table responses
  add column if not exists stance smallint,
  add column if not exists share_consent boolean not null default false,
  add column if not exists moderation_status text not null default 'pending',
  add column if not exists moderation_reason text;

alter table responses
  drop constraint if exists responses_stance_range;
alter table responses
  add constraint responses_stance_range check (stance is null or stance between -2 and 2);

alter table responses
  drop constraint if exists responses_moderation_status_values;
alter table responses
  add constraint responses_moderation_status_values
  check (moderation_status in ('pending', 'approved', 'rejected', 'hidden'));

create index if not exists responses_other_side_idx
  on responses (question_id, stance)
  where share_consent and moderation_status = 'approved';

alter table questions
  add column if not exists stance_enabled boolean not null default true,
  add column if not exists stance_label_low text,
  add column if not exists stance_label_high text;

-- Visitors may insert their own entry, but never read the table directly and
-- never set their own moderation status to something publicly visible.
drop policy if exists "Allow all select on responses" on responses;
drop policy if exists "Allow all insert on responses" on responses;
drop policy if exists "Allow all update on responses" on responses;
drop policy if exists "Allow all delete on responses" on responses;
drop policy if exists "Allow anonymous select responses" on responses;
drop policy if exists "Allow anonymous insert responses" on responses;

create policy "Visitors may submit a response" on responses
  for insert
  to public
  with check (moderation_status in ('pending', 'rejected'));

create policy "Team may read responses" on responses
  for select
  to authenticated
  using (true);

create policy "Team may moderate responses" on responses
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Team may delete responses" on responses
  for delete
  to authenticated
  using (true);

-- Aggregate stance counts for one question. Counts only — no rows, no text.
-- The output columns are deliberately not named "stance" or "responses": in a
-- SQL-language function those names are in scope as parameters and would shadow
-- the table and its column.
create or replace function stance_counts(p_question_id uuid)
returns table (stance_value smallint, response_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.stance, count(*)::bigint
  from responses r
  where r.question_id = p_question_id
  group by r.stance;
$$;

-- One approved, consented reflection from the requested side of the scale.
-- p_opposing_sign is -1 for the disagree half or 1 for the agree half.
create or replace function other_side(
  p_question_id uuid,
  p_opposing_sign smallint,
  p_exclude_ids uuid[] default '{}'
)
returns table (response_id uuid, excerpt text, stance_value smallint)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, left(r.response, 400), r.stance
  from responses r
  where r.question_id = p_question_id
    and r.share_consent
    and r.moderation_status = 'approved'
    and r.stance is not null
    and case when p_opposing_sign < 0 then r.stance < 0 else r.stance > 0 end
    and not (r.id = any(coalesce(p_exclude_ids, '{}')))
  order by random()
  limit 1;
$$;

-- Reporting hides an entry from every visitor immediately, pending review.
create or replace function report_response(p_response_id uuid)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update responses
  set moderation_status = 'hidden',
      moderation_reason = coalesce(moderation_reason, 'Reported by a visitor')
  where id = p_response_id
    and moderation_status <> 'rejected';
$$;

revoke all on function stance_counts(uuid) from public;
revoke all on function other_side(uuid, smallint, uuid[]) from public;
revoke all on function report_response(uuid) from public;

grant execute on function stance_counts(uuid) to anon, authenticated;
grant execute on function other_side(uuid, smallint, uuid[]) to anon, authenticated;
grant execute on function report_response(uuid) to anon, authenticated;
