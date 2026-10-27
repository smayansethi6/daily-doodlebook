-- Private mailing list. Only the server (service_role) may read or write it.
create table if not exists email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'pending' check (status in ('pending', 'active', 'unsubscribed')),
  confirmation_token uuid not null unique default gen_random_uuid(),
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table email_subscribers enable row level security;
revoke all on email_subscribers from anon, authenticated;

create table if not exists daily_email_deliveries (
  subscriber_id uuid not null references email_subscribers(id) on delete cascade,
  question_date date not null,
  sent_at timestamptz not null default now(),
  primary key (subscriber_id, question_date)
);
alter table daily_email_deliveries enable row level security;
revoke all on daily_email_deliveries from anon, authenticated;
