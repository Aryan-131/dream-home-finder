create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- First user to sign up becomes admin
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles(user_id, role) values (new.id, 'user');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created_role after insert on auth.users for each row execute function public.handle_new_user_role();

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  listing_type text not null default 'sale',
  property_type text not null default 'house',
  price numeric not null default 0,
  city text not null default '',
  address text not null default '',
  bedrooms int not null default 0,
  bathrooms int not null default 0,
  area_sqft int not null default 0,
  image_url text not null default '',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.properties to anon, authenticated;
grant insert, update, delete on public.properties to authenticated;
grant all on public.properties to service_role;
alter table public.properties enable row level security;
create policy "Anyone views properties" on public.properties for select to anon, authenticated using (true);
create policy "Admins insert properties" on public.properties for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "Admins update properties" on public.properties for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins delete properties" on public.properties for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.property_contacts (
  property_id uuid primary key references public.properties(id) on delete cascade,
  owner_name text not null default '',
  owner_phone text not null default '',
  owner_email text not null default ''
);
grant select, insert, update, delete on public.property_contacts to authenticated;
grant all on public.property_contacts to service_role;
alter table public.property_contacts enable row level security;
create policy "Signed-in users view contacts" on public.property_contacts for select to authenticated using (true);
create policy "Admins insert contacts" on public.property_contacts for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "Admins update contacts" on public.property_contacts for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins delete contacts" on public.property_contacts for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.favorites (
  user_id uuid not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "Own favorites select" on public.favorites for select to authenticated using (user_id = auth.uid());
create policy "Own favorites insert" on public.favorites for insert to authenticated with check (user_id = auth.uid());
create policy "Own favorites delete" on public.favorites for delete to authenticated using (user_id = auth.uid());

insert into public.properties (id,title,description,listing_type,property_type,price,city,address,bedrooms,bathrooms,area_sqft,image_url,featured) values
('11111111-0000-0000-0000-000000000001','Terracotta Courtyard Villa','A sun-washed villa wrapped around a private courtyard with olive trees, arched doorways and a plunge pool.','sale','villa',32500000,'Goa','Assagao, North Goa',4,4,3800,'/images/p1.jpg',true),
('11111111-0000-0000-0000-000000000002','Linen Loft Apartment','Airy top-floor apartment with double-height windows, oak floors and city views.','rent',' apartment',85000,'Mumbai','Bandra West',2,2,1250,'/images/p2.jpg',true),
('11111111-0000-0000-0000-000000000003','Garden Bungalow','Single-level bungalow with a deep veranda and mature gardens on a quiet lane.','sale','house',18900000,'Bengaluru','Indiranagar',3,3,2400,'/images/p3.jpg',true),
('11111111-0000-0000-0000-000000000004','Riverside Studio','Compact, light-filled studio steps from the riverfront promenade.','rent','apartment',28000,'Pune','Koregaon Park',1,1,620,'/images/p4.jpg',false),
('11111111-0000-0000-0000-000000000005','Heritage Townhouse','Restored three-storey townhouse with original tiles and a rooftop terrace.','sale','house',24000000,'Jaipur','C-Scheme',4,3,3100,'/images/p3.jpg',false),
('11111111-0000-0000-0000-000000000006','Hillside Retreat Villa','Stone-clad villa with panoramic valley views and a wraparound deck.','rent','villa',150000,'Goa','Siolim',5,5,4500,'/images/p1.jpg',false);
update public.properties set property_type='apartment' where id='11111111-0000-0000-0000-000000000002';
insert into public.property_contacts values
('11111111-0000-0000-0000-000000000001','Anita Rao','+91 98200 11111','anita@example.com'),
('11111111-0000-0000-0000-000000000002','Rahul Mehta','+91 98200 22222','rahul@example.com'),
('11111111-0000-0000-0000-000000000003','Priya Iyer','+91 98200 33333','priya@example.com'),
('11111111-0000-0000-0000-000000000004','Karan Shah','+91 98200 44444','karan@example.com'),
('11111111-0000-0000-0000-000000000005','Meera Singh','+91 98200 55555','meera@example.com'),
('11111111-0000-0000-0000-000000000006','Dev Fernandes','+91 98200 66666','dev@example.com');