# Daily Doodlebook

## Setup

1. Copy the example env file into place: `cp .env.example .env`, then fill in the values.
2. Install dependencies (this project uses Node 22+): `npm install`.
3. Run the dev server with `npm run dev`.

For a deployment (e.g. Vercel), add the same `VITE_` variables in the host's environment settings and redeploy: Vite reads them at build time.

## Gemini

- The reflection chat (Ink) and the screen that checks shared reflections both call Gemini from server functions in `api/` (`/api/ink`, `/api/screen`). The browser never sees the key.
- Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, default `gemini-3.5-flash-lite`) in `.env` for local dev and in Vercel → Settings → Environment Variables for production. Mark the key **Sensitive** in Vercel.
- Never name it `VITE_GEMINI_API_KEY`: anything prefixed `VITE_` is compiled into the public JavaScript, where Google detects it and suspends the key.
- `npm run dev` serves the `api/` functions too, so Ink works locally.
- Ink's prompt is built on the server, so the endpoint cannot be used as a general-purpose chatbot on your key. Still give the key a daily quota in Google Cloud.

## Supabase

Migrations live in `src/migrations`. Run them in filename order in the Supabase SQL editor. The latest three:

- `20261013_the_other_side.sql`: stance scale, share consent, moderation, and the aggregate-only read path for responses.
- `20261014_lock_down_writes.sql`: the site can only read questions and submit responses. Adding, editing, scheduling and moderating happen in the Supabase dashboard.
- `20261017_daily_rotation_365.sql`: the ThinkPhil 365 statements and the daily rotation.

### Daily question

- One question a day, the same for every visitor, changing at 00:00 GST (UTC+4).
- The 365 statements are numbered. Number 1 runs on the day the rotation migration is applied, then one a day, starting again after 365. To restart on another day: `update question_rotation set starts_on = 'YYYY-MM-DD';`
- A row in `question_schedules` (`question_id`, `scheduled_date`) overrides the rotation for that day. New questions you add without a `rotation_position` only appear on dates scheduled for them; to add one to the end of the rotation, give it the next `rotation_position` (366, 367, …).
- The page calls `get_daily_question(target_date)` with today's Dubai date, and a tab left open moves to the new question at midnight. If Supabase is unreachable it shows the last question saved on the device, or a bundled standby one.

## Managing content

There is no admin panel. Use the Supabase dashboard:

- **Questions:** Table editor → `questions`. Set `stance_enabled`, `stance_label_low` and `stance_label_high` there to change the agree / disagree scale.
- **Scheduling:** Table editor → `question_schedules`.
- **Moderation:** Table editor → `responses`. Entries visitors agreed to share (`share_consent = true`) are shown to others only once `moderation_status` is set to `approved`.



1- font needs to be changed “new question every day at midnight” tuesday 11 august, 2026” . 2- need a nudge - open reflection chat’s “ink” can be changed as well - no need to have a name of the AI. 3- decrease the size of “THINK” a daily exercise in philosophy 4- add an “about” page to the website which talks about what the project is/ why you should collaborate (there can be placeholder text for now) 5-