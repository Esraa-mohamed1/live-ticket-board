-- ENUMS
create type ticket_priority as enum ('low','medium','high');
create type ticket_status   as enum ('open','in_progress','resolved');
create type user_role       as enum ('customer','agent');

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- HELPER
create or replace function public.is_agent() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'agent'
  );
$$;

-- TICKETS
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null default coalesce(auth.uid(), gen_random_uuid()),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null check (char_length(btrim(description)) between 10 and 2000),
  priority ticket_priority not null default 'medium',
  status ticket_status not null default 'open',
  idempotency_key uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, idempotency_key)
);

-- INDEXES
create index if not exists tickets_customer_created_idx on public.tickets (customer_id, created_at desc, id desc);
create index if not exists tickets_created_idx          on public.tickets (created_at desc, id desc);
create index if not exists tickets_status_priority_idx  on public.tickets (status, priority);

-- updated_at
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists tickets_updated_at on public.tickets;
create trigger tickets_updated_at before update on public.tickets
for each row execute function public.set_updated_at();

-- RATE LIMIT (serialized per user/customer => safe under concurrent requests)
create or replace function public.enforce_ticket_rate_limit() returns trigger
language plpgsql as $$
declare recent int;
begin
  perform pg_advisory_xact_lock(hashtext(new.customer_id::text));
  select count(*) into recent from public.tickets
   where customer_id = new.customer_id and created_at > now() - interval '1 minute';
  if recent >= 5 then
    raise exception 'rate_limit_exceeded' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists tickets_rate_limit on public.tickets;
create trigger tickets_rate_limit before insert on public.tickets
for each row execute function public.enforce_ticket_rate_limit();

-- Agents may change ONLY status
create or replace function public.guard_ticket_update() returns trigger language plpgsql as $$
begin
  if (new.title, new.description, new.priority, new.customer_id, new.idempotency_key)
     is distinct from
     (old.title, old.description, old.priority, old.customer_id, old.idempotency_key) then
    raise exception 'only_status_can_change';
  end if;
  return new;
end $$;

drop trigger if exists tickets_guard_update on public.tickets;
create trigger tickets_guard_update before update on public.tickets
for each row execute function public.guard_ticket_update();

-- RLS
alter table public.profiles enable row level security;
alter table public.tickets  enable row level security;

-- PROFILES POLICIES
drop policy if exists "read profile" on public.profiles;
create policy "read profile" on public.profiles
  for select using (auth.uid() is null or id = (select auth.uid()));

-- TICKETS POLICIES
drop policy if exists "tickets select policy" on public.tickets;
create policy "tickets select policy" on public.tickets
  for select using (
    (auth.uid() is not null and (customer_id = auth.uid() or public.is_agent()))
    or (auth.uid() is null)
  );

drop policy if exists "tickets insert policy" on public.tickets;
create policy "tickets insert policy" on public.tickets
  for insert with check (
    ((auth.uid() is not null and customer_id = auth.uid()) or auth.uid() is null)
    and status = 'open'
  );

drop policy if exists "tickets update policy" on public.tickets;
create policy "tickets update policy" on public.tickets
  for update using (
    (auth.uid() is not null and public.is_agent())
    or (auth.uid() is null)
  );

-- STATS (security invoker => RLS applies automatically)
create or replace function public.ticket_stats()
returns table (status ticket_status, priority ticket_priority, count bigint)
language sql stable security invoker as $$
  select status, priority, count(*) from public.tickets group by 1, 2;
$$;

-- REALTIME
alter publication supabase_realtime add table public.tickets;
