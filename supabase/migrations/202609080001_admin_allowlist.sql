-- Restrict writes to an explicit administrator allowlist.
--
-- Until now every authenticated user could insert, update and delete in all five tables:
-- the "Admin" policies were named after an intent they did not enforce. The only thing keeping
-- the data safe was that exactly one account existed and sign-up was disabled, which lives in
-- dashboard settings rather than in the schema. This moves the boundary into the database.
--
-- Public read access is unchanged.

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- No policies and no grants: the table is unreadable and unwritable through the API, for anon
-- and authenticated alike. Administrators are added with SQL, deliberately. is_admin() reaches
-- it as the definer instead, so a policy can consult it without exposing the list.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Preserve current access: everyone who can write today is an administrator today.
insert into public.admins (user_id)
select id from auth.users
on conflict (user_id) do nothing;

do $$
declare table_name text;
begin
  foreach table_name in array array['crop_types', 'varieties', 'growing_locations', 'harvests', 'crop_goals'] loop
    execute format('drop policy "Admin insert" on public.%I', table_name);
    execute format('drop policy "Admin update" on public.%I', table_name);
    execute format('drop policy "Admin delete" on public.%I', table_name);

    execute format('create policy "Admin insert" on public.%I for insert to authenticated with check (public.is_admin())', table_name);
    execute format('create policy "Admin update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', table_name);
    execute format('create policy "Admin delete" on public.%I for delete to authenticated using (public.is_admin())', table_name);
  end loop;
end $$;
