-- Tighten table privileges to match what each role actually needs.
--
-- The tables were created while ALTER DEFAULT PRIVILEGES granted everything to anon and
-- authenticated, so all five carry anon=arwdDxtm: anonymous requests hold INSERT, UPDATE and
-- DELETE at the table level, and only RLS denies them. The intended model is that anon can read
-- and nothing more, so the grant should say so too rather than leaning on the policies alone.
--
-- TRUNCATE matters separately: it is not filtered by row level security, so a role holding it can
-- empty a table regardless of policy. PostgREST exposes no truncate endpoint, so this is
-- defence in depth rather than a reachable hole today.
--
-- Read access and the authenticated write path are unchanged; writes stay gated by is_admin().

revoke all on public.crop_types, public.varieties, public.growing_locations,
              public.harvests, public.crop_goals
  from anon, authenticated;

grant select on public.crop_types, public.varieties, public.growing_locations,
                public.harvests, public.crop_goals
  to anon, authenticated;

grant insert, update, delete on public.crop_types, public.varieties, public.growing_locations,
                                public.harvests, public.crop_goals
  to authenticated;

-- The allowlist stays unreachable through the API; is_admin() reads it as definer.
revoke all on public.admins from anon, authenticated;

-- Stop new tables from inheriting the same over-broad grants.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
