-- EngiMart schema for Supabase / PostgreSQL
-- Run this in the Supabase SQL editor on a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  base_price numeric(12, 2) not null check (base_price >= 0),
  sale_price numeric(12, 2) check (sale_price is null or (sale_price >= 0 and sale_price < base_price)),
  image_url text,
  is_available boolean not null default true,
  source_url text,
  created_at timestamptz not null default now()
);

alter table if exists public.products add column if not exists source_url text;
alter table if exists public.products add column if not exists sale_price numeric(12, 2);

create table if not exists public.pricing_settings (
  id uuid primary key default gen_random_uuid(),
  tier_min numeric(12, 2) not null,
  tier_max numeric(12, 2),
  fee_type text not null check (fee_type in ('flat', 'percentage')),
  fee_value numeric(12, 4) not null,
  sort_order int not null default 0
);

create sequence if not exists public.order_number_seq start with 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null default nextval('public.order_number_seq') unique,
  user_id uuid not null references auth.users (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'deposit_paid', 'approved', 'declined', 'completed')),
  items_subtotal numeric(12, 2) not null,
  service_fee numeric(12, 2) not null,
  total_price numeric(12, 2) not null,
  deposit_amount numeric(12, 2) not null,
  transfer_proof_url text,
  hidden_from_admin boolean not null default false,
  decline_reason text,
  created_at timestamptz not null default now()
);

alter sequence public.order_number_seq owned by public.orders.order_number;
grant usage, select on sequence public.order_number_seq to authenticated;
grant usage, select on sequence public.order_number_seq to service_role;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  quantity int not null check (quantity > 0 and quantity <= 99),
  unit_base_price_at_order_time numeric(12, 2) not null
);

create table if not exists public.custom_order_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  description text not null,
  suggested_location text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'priced', 'approved', 'declined', 'completed')),
  sourced_price numeric(12, 2),
  service_fee numeric(12, 2),
  total_price numeric(12, 2),
  deposit_amount numeric(12, 2),
  order_id uuid references public.orders (id) on delete set null,
  hidden_from_admin boolean not null default false,
  decline_reason text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);

create index if not exists orders_hidden_from_admin_idx
  on public.orders (created_at desc)
  where hidden_from_admin = false;

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists custom_order_requests_user_id_created_at_idx
  on public.custom_order_requests (user_id, created_at desc);

create index if not exists custom_order_requests_hidden_from_admin_idx
  on public.custom_order_requests (created_at desc)
  where hidden_from_admin = false;

create index if not exists custom_order_requests_status_created_at_idx
  on public.custom_order_requests (status, created_at desc);

create index if not exists products_created_at_idx
  on public.products (created_at asc);

create index if not exists products_is_available_idx
  on public.products (is_available);

-- ---------------------------------------------------------------------------
-- Profile creation on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Default pricing tiers
-- subtotal < 200 → 30 EGP flat
-- 200 to 1000 → 12%
-- over 1000 → 8%
-- ---------------------------------------------------------------------------

insert into public.pricing_settings (tier_min, tier_max, fee_type, fee_value, sort_order)
select * from (
  values
    (0::numeric, 199.99::numeric, 'flat', 30::numeric, 0),
    (200::numeric, 1000::numeric, 'percentage', 12::numeric, 1),
    (1000.01::numeric, null::numeric, 'percentage', 8::numeric, 2)
) as seed(tier_min, tier_max, fee_type, fee_value, sort_order)
where not exists (select 1 from public.pricing_settings);

-- ---------------------------------------------------------------------------
-- Products catalog (managed by admin via the admin panel)
-- ---------------------------------------------------------------------------



-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transfer-proofs',
  'transfer-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_order_requests enable row level security;

-- profiles: users see and update only themselves
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- products: anyone can browse; writes go through the service role (admin API)
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (true);

-- pricing: readable so checkout can explain the fee; writes via service role
drop policy if exists "pricing_public_read" on public.pricing_settings;
create policy "pricing_public_read"
  on public.pricing_settings for select
  to anon, authenticated
  using (true);

-- orders: each user only their own rows
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  to authenticated
  with check (user_id = auth.uid());

-- Orders are not updatable or deletable by students. Transfer proofs,
-- status changes, and removals go through server routes that check identity first.
drop policy if exists "orders_delete_own" on public.orders;
drop policy if exists "order_items_delete_own" on public.order_items;

-- order_items: visible/insertable when the parent order belongs to the user
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- custom requests: own rows only
drop policy if exists "custom_select_own" on public.custom_order_requests;
create policy "custom_select_own"
  on public.custom_order_requests for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "custom_insert_own" on public.custom_order_requests;
create policy "custom_insert_own"
  on public.custom_order_requests for insert
  to authenticated
  with check (user_id = auth.uid());

-- Custom requests: the owner may delete their own row.
-- Admin hide uses the service role and sets hidden_from_admin.
drop policy if exists "custom_delete_own" on public.custom_order_requests;
create policy "custom_delete_own"
  on public.custom_order_requests for delete
  to authenticated
  using (user_id = auth.uid());

-- storage: public read for product images
drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

-- transfer proofs: owner can read their own folder
drop policy if exists "transfer_proofs_own_read" on storage.objects;
create policy "transfer_proofs_own_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'transfer-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "transfer_proofs_own_insert" on storage.objects;
create policy "transfer_proofs_own_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'transfer-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
