# Daily Doodlebook

## Setup

1. Copy the example env file into place: `cp .env.example .env`.
2. Install dependencies (this project uses Node 22+): `npm install`.
3. Run the dev server with `npm run dev`.

## Gemini

- The floating reflection chatbot uses the official `@google/genai` JavaScript SDK with `gemini-2.5-flash` by default.
- Add `VITE_GEMINI_API_KEY` to `.env` to enable the chatbot.
- Optional: override the model with `VITE_GEMINI_MODEL`.
- The chatbot behavior is shaped through app-specific system instructions rather than true model fine-tuning.

## Supabase

- The app pulls a single, randomly selected question via a Supabase Postgres function, so the `questions` table is the primary source of truth.
- Supabase enforces row-level security, but `src/migrations/20260411_create_questions_table.sql` seeds the table (each row now stores just `question` + `category`), creates `get_random_question()`, and defines policies that let the `anon` role read/write without logging in, matching the client-side needs.
- A second migration `src/migrations/20260412_create_responses_table.sql` creates the `responses` table (linked to questions by `question_id`) and allows the anonymous role to insert, so every visitor’s written reply is persisted per category.
- Each saved response returns the Supabase-generated ID and timestamp; the client stores that ID/log locally (`localStorage` keys `daily-doodlebook-response-ids` and `daily-doodlebook-response-log`) so anonymous users can revisit their history through the “My responses” page (reachable from the masthead) and Supabase can be queried for every saved detail by ID.

## Admin

- `/admin/login` is the entry point for the admin panel. It currently signs in through Supabase Auth so you can provision admin users directly in the Supabase dashboard and any Auth user can land on `/admin` after signing in.  
- After logging in you land on `/admin`, which renders a sidebar that switches between *Manage questions* (create/edit/delete and set categories) and *Manage responses* (filter by category/search/date, view a list, and see Recharts-powered pie/bar visualizations). The layout reuses the squared typography/spacing of the main site.  
- Sessions persist locally until you sign out by clicking the “Sign out” button at the top right.
- Supabase configuration lives in `.env` / `.env.example` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Replace the example values when you switch projects.
- All migrations ship under `src/migrations`. Run them (`supabase db push` or `psql`) to seed the `questions` table and create the `get_random_question` function that the front end calls every time the page loads.

## Daily question flow

- The page queries Supabase through `src/lib/questions.ts` (React Query) and renders one `QuestionCard` with the current prompt.
- If Supabase is unreachable, the UI will show a short error message and let you refresh when the service returns.
