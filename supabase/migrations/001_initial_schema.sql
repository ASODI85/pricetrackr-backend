create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";
create extension if not exists "pg_net";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, premium_active boolean default false,
  premium_expires_at timestamptz, stripe_customer_id text,
  email_alerts_enabled boolean default false,
  check_interval_minutes integer default 360,
  currency text default 'USD',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$ begin insert into public.users (id, email) values (new.id, new.email) on conflict (id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.watchlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null check (type in ('flight','hotel')),
  label text not null, currency text not null default 'USD',
  alert_enabled boolean default true, alert_threshold_pct numeric default 5,
  last_price numeric, last_checked_at timestamptz, email_alerts_enabled boolean default false,
  origin text, destination text, departure_date date, return_date date, adults integer default 1,
  hotel_id text, hotel_name text, check_in date, check_out date,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.price_history (
  id uuid primary key default uuid_generate_v4(),
  watchlist_id uuid references public.watchlists(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  price numeric not null, currency text not null, provider text default 'duffel',
  recorded_at timestamptz default now()
);
create table if not exists public.affiliate_clicks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  watchlist_id uuid references public.watchlists(id) on delete set null,
  destination_url text, tracked_url text, clicked_at timestamptz default now()
);
create table if not exists public.alert_log (
  id uuid primary key default uuid_generate_v4(),
  watchlist_id uuid references public.watchlists(id) on delete cascade,
  price numeric, drop_pct numeric, alerted_at timestamptz default now()
);

alter table public.users enable row level security;
alter table public.watchlists enable row level security;
alter table public.price_history enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.alert_log enable row level security;

create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);
create policy "watchlists_select_own" on public.watchlists for select using (auth.uid() = user_id);
create policy "watchlists_insert_own" on public.watchlists for insert with check (auth.uid() = user_id);
create policy "watchlists_update_own" on public.watchlists for update using (auth.uid() = user_id);
create policy "watchlists_delete_own" on public.watchlists for delete using (auth.uid() = user_id);
create policy "price_history_select_own" on public.price_history for select using (auth.uid() = user_id);
create policy "affiliate_clicks_select_own" on public.affiliate_clicks for select using (auth.uid() = user_id);

create index if not exists idx_watchlists_user_id on public.watchlists(user_id);
create index if not exists idx_watchlists_alert_enabled on public.watchlists(alert_enabled) where alert_enabled = true;
create index if not exists idx_price_history_watchlist on public.price_history(watchlist_id, recorded_at desc);

select cron.schedule('pricetrackr-cleanup','0 2 * * *', $$ delete from public.price_history where recorded_at < now() - interval '90 days'; $$);