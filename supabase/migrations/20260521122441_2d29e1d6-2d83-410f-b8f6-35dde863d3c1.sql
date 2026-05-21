
-- Enums
create type public.app_role as enum ('buyer', 'seller', 'both', 'admin');
create type public.gig_status as enum ('pending', 'active', 'rejected', 'paused');
create type public.order_status as enum ('pending', 'active', 'delivered', 'completed', 'cancelled', 'disputed');
create type public.package_type as enum ('basic', 'standard', 'premium');
create type public.transaction_type as enum ('deposit', 'payment', 'withdrawal', 'refund');
create type public.transaction_status as enum ('pending', 'completed', 'failed');
create type public.dispute_status as enum ('open', 'resolved', 'rejected');
create type public.notification_type as enum ('message', 'order', 'review', 'system');

-- user_roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users view own roles" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  skills text[] default '{}',
  location text,
  languages text[] default '{}',
  experience_level text,
  response_time text,
  is_online boolean default false,
  rating_avg float default 0,
  total_reviews int default 0,
  completed_orders int default 0,
  email_verified boolean default false,
  is_banned boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Admins manage profiles" on public.profiles for all using (public.has_role(auth.uid(), 'admin'));

-- gigs
create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  category text not null,
  description text not null,
  price_basic decimal(10,2) not null,
  price_standard decimal(10,2),
  price_premium decimal(10,2),
  delivery_days_basic int not null default 3,
  delivery_days_standard int,
  delivery_days_premium int,
  revisions int default 1,
  images text[] default '{}',
  tags text[] default '{}',
  status gig_status not null default 'pending',
  views int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gigs enable row level security;
create policy "Active gigs viewable by everyone" on public.gigs for select using (status = 'active' or seller_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Sellers create own gigs" on public.gigs for insert with check (auth.uid() = seller_id);
create policy "Sellers update own gigs" on public.gigs for update using (auth.uid() = seller_id);
create policy "Sellers delete own gigs" on public.gigs for delete using (auth.uid() = seller_id);
create policy "Admins manage gigs" on public.gigs for all using (public.has_role(auth.uid(), 'admin'));

-- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid references public.gigs(id) on delete set null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  package_type package_type not null,
  amount decimal(10,2) not null,
  requirements text,
  status order_status not null default 'pending',
  delivery_file_url text,
  delivered_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Order parties view orders" on public.orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id or public.has_role(auth.uid(), 'admin'));
create policy "Buyers create orders" on public.orders for insert with check (auth.uid() = buyer_id);
create policy "Order parties update orders" on public.orders for update using (auth.uid() = buyer_id or auth.uid() = seller_id or public.has_role(auth.uid(), 'admin'));

-- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  file_url text,
  is_read boolean default false,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "Participants view messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users send messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Receivers update read" on public.messages for update using (auth.uid() = receiver_id);

-- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(order_id, reviewer_id)
);
alter table public.reviews enable row level security;
create policy "Reviews viewable by everyone" on public.reviews for select using (true);
create policy "Buyers create reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- wallets
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  balance decimal(10,2) not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
create policy "Users view own wallet" on public.wallets for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage wallets" on public.wallets for all using (public.has_role(auth.uid(), 'admin'));

-- transactions
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type transaction_type not null,
  amount decimal(10,2) not null,
  status transaction_status not null default 'pending',
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "Users view own transactions" on public.transactions for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage transactions" on public.transactions for all using (public.has_role(auth.uid(), 'admin'));

-- favorites
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  gig_id uuid references public.gigs(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, gig_id)
);
alter table public.favorites enable row level security;
create policy "Users manage own favorites" on public.favorites for all using (auth.uid() = user_id);

-- disputes
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  raised_by uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  status dispute_status not null default 'open',
  admin_resolution text,
  created_at timestamptz not null default now()
);
alter table public.disputes enable row level security;
create policy "Order parties view disputes" on public.disputes for select using (
  auth.uid() = raised_by or public.has_role(auth.uid(), 'admin') or
  exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid()))
);
create policy "Users raise disputes" on public.disputes for insert with check (auth.uid() = raised_by);
create policy "Admins manage disputes" on public.disputes for all using (public.has_role(auth.uid(), 'admin'));

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type notification_type not null default 'system',
  is_read boolean default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "Users view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger gigs_updated before update on public.gigs for each row execute function public.set_updated_at();

-- handle new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _role app_role;
begin
  _role := coalesce((new.raw_user_meta_data->>'role')::app_role, 'buyer');
  insert into public.profiles (id, username, full_name, avatar_url, email_verified)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'avatar_url',
      new.email_confirmed_at is not null
    );
  insert into public.user_roles (user_id, role) values (new.id, _role) on conflict do nothing;
  insert into public.wallets (user_id, balance) values (new.id, 0) on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
