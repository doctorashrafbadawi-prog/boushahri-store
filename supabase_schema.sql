-- BOUSHAHRI MEDICAL STORE - Supabase schema
create extension if not exists "uuid-ossp";

create table if not exists clinics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  doctor_name text,
  phone text,
  balance numeric default 0,
  created_at timestamptz default now()
);

create table if not exists users_app (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  password text not null,
  role text not null check (role in ('admin','warehouse','clinic')),
  clinic_id uuid references clinics(id) on delete set null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  address text,
  balance numeric default 0,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null default 'Dental',
  unit text default 'PCS',
  purchase_price numeric default 0,
  sale_price numeric default 0,
  stock numeric default 0,
  min_stock numeric default 5,
  created_at timestamptz default now()
);

create table if not exists purchase_invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_no text,
  supplier_id uuid references suppliers(id) on delete set null,
  invoice_date date not null default current_date,
  notes text,
  total numeric default 0,
  created_at timestamptz default now()
);

create table if not exists purchase_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references purchase_invoices(id) on delete cascade,
  product_id uuid references products(id) on delete restrict,
  qty numeric not null,
  price numeric not null,
  total numeric generated always as (qty * price) stored
);

create table if not exists clinic_requests (
  id uuid primary key default uuid_generate_v4(),
  request_no text,
  clinic_id uuid references clinics(id) on delete set null,
  request_date date not null default current_date,
  status text default 'Pending' check (status in ('Pending','Approved','Prepared','Delivered','Rejected')),
  notes text,
  total numeric default 0,
  created_at timestamptz default now()
);

create table if not exists request_items (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid references clinic_requests(id) on delete cascade,
  product_id uuid references products(id) on delete restrict,
  qty numeric not null,
  price numeric default 0,
  total numeric generated always as (qty * price) stored
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_role text,
  clinic_id uuid references clinics(id) on delete cascade,
  title text not null,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);

insert into users_app(username,password,role)
values ('BOUSHAHRI','BOUSHAHRI','admin')
on conflict (username) do nothing;

insert into suppliers(name, phone) values ('Default Supplier','') on conflict do nothing;
insert into products(name, category, unit, purchase_price, sale_price, stock, min_stock)
values
('Dental Gloves','Dental','Box',0,0,0,5),
('Surgical Mask','Surgical','Box',0,0,0,5),
('Lab Tube','Lab','PCS',0,0,0,5)
on conflict do nothing;
