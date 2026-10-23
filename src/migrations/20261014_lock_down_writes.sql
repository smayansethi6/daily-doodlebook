-- Questions are managed in the Supabase dashboard, not from the site. Until now
-- any visitor holding the public anon key could add, edit or delete questions
-- and schedules straight through the REST API, and any signed-in Supabase
-- account could read and moderate every response. With these policies gone,
-- the site can only read questions and submit responses; everything else
-- happens in the Supabase table editor or SQL editor, which bypass row-level
-- security. Safe to run more than once.

drop policy if exists "Allow all insert on questions" on questions;
drop policy if exists "Allow all update on questions" on questions;
drop policy if exists "Allow all delete on questions" on questions;

drop policy if exists "Allow all insert on question_schedules" on question_schedules;
drop policy if exists "Allow all update on question_schedules" on question_schedules;
drop policy if exists "Allow all delete on question_schedules" on question_schedules;

-- Responses: visitors keep only "Visitors may submit a response". Moderation
-- (setting moderation_status to 'approved') is done in the table editor.
drop policy if exists "Team may read responses" on responses;
drop policy if exists "Team may moderate responses" on responses;
drop policy if exists "Team may delete responses" on responses;
