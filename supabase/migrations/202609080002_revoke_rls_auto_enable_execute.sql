-- The dashboard's "automatically enable RLS on new tables" option creates a SECURITY DEFINER
-- event trigger function, public.rls_auto_enable(), and leaves the default EXECUTE grant on it.
-- That exposes it over PostgREST as /rest/v1/rpc/rls_auto_enable to anon and authenticated.
-- It is only ever meant to fire from the event trigger, so revoke the API grants.
--
-- Guarded: the function only exists in projects where that option was enabled, which is
-- production but not development.

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
