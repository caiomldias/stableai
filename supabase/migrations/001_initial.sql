create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  base_currency text not null default 'BRL' check (base_currency in ('BRL', 'USD')),
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.institution_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pluggy_item_id text not null,
  institution text not null default 'Instituição financeira',
  status text not null default 'SYNCING',
  products text[] not null default '{}',
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, pluggy_item_id)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.institution_connections(id) on delete cascade,
  pluggy_account_id text not null,
  institution text not null,
  name text not null,
  type text not null,
  currency text not null default 'BRL',
  balance_cents bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, pluggy_account_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  pluggy_transaction_id text not null,
  description text not null,
  merchant text,
  amount_cents bigint not null,
  currency text not null default 'BRL',
  transaction_date date not null,
  flow text not null,
  kind text not null,
  original_category text not null default 'Outros',
  raw_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, pluggy_transaction_id)
);

create table if not exists public.transaction_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  category text,
  note text,
  tags text[] not null default '{}',
  unique (user_id, transaction_id)
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.institution_connections(id) on delete cascade,
  pluggy_investment_id text not null,
  institution text not null,
  name text not null,
  type text not null,
  currency text not null default 'BRL',
  balance_cents bigint not null default 0,
  original_cents bigint,
  profit_cents bigint,
  raw_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, pluggy_investment_id)
);

create table if not exists public.recurring_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  average_amount_cents bigint not null,
  currency text not null default 'BRL',
  next_date date not null,
  confidence numeric not null default 0,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.boletos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  description text not null,
  issuer text not null,
  amount_cents bigint not null,
  currency text not null default 'BRL',
  due_date date not null,
  status text not null default 'PENDING',
  digitable_line_encrypted text,
  source text not null default 'MANUAL',
  created_at timestamptz not null default now()
);

comment on column public.boletos.digitable_line_encrypted is 'Campo reservado ao modelo normalizado; finance_state.payload armazena linhas digitáveis cifradas com AES-256-GCM.';

create table if not exists public.shared_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_external_id text not null,
  person text not null,
  amount_cents bigint not null,
  currency text not null default 'BRL',
  due_date date not null,
  installments integer not null default 1,
  note text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'OTHER',
  target_cents bigint not null,
  saved_cents bigint not null default 0,
  currency text not null default 'BRL',
  created_at timestamptz not null default now()
);

create table if not exists public.vault_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vault_id uuid not null references public.vaults(id) on delete cascade,
  amount_cents bigint not null,
  contribution_date date not null default current_date
);

create table if not exists public.purchase_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  price_cents bigint not null,
  saved_cents bigint not null default 0,
  contribution_cents bigint not null,
  currency text not null default 'BRL',
  frequency text not null,
  estimated_date date,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  image_url text,
  price_cents bigint not null,
  currency text not null default 'BRL',
  contribution_cents bigint not null,
  frequency text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app boolean not null default true,
  email boolean not null default false,
  push boolean not null default false,
  days_before integer not null default 3 check (days_before between 0 and 30)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone)
  on conflict (id) do nothing;
  insert into public.finance_state (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.notification_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.finance_state enable row level security;
alter table public.institution_connections enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_overrides enable row level security;
alter table public.investments enable row level security;
alter table public.recurring_payments enable row level security;
alter table public.boletos enable row level security;
alter table public.shared_expenses enable row level security;
alter table public.vaults enable row level security;
alter table public.vault_contributions enable row level security;
alter table public.purchase_goals enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.audit_events enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'finance_state', 'institution_connections', 'accounts', 'transactions',
    'transaction_overrides', 'investments', 'recurring_payments', 'boletos',
    'shared_expenses', 'vaults', 'vault_contributions', 'purchase_goals',
    'wishlist_items', 'notification_preferences', 'audit_events'
  ] loop
    execute format('drop policy if exists "owner access" on public.%I', table_name);
    execute format('create policy "owner access" on public.%I for all using (auth.uid() = %s) with check (auth.uid() = %s)',
      table_name,
      case when table_name in ('profiles') then 'id' else 'user_id' end,
      case when table_name in ('profiles') then 'id' else 'user_id' end
    );
  end loop;
end $$;
