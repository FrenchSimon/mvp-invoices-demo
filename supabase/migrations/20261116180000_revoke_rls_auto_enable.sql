-- public.rls_auto_enable() est créée par Supabase (réglage du projet), pas par nos migrations.
-- C'est la fonction de l'event trigger « ensure_rls » : elle active la RLS sur chaque nouvelle
-- table de public. Elle est security definer et appelable par anon et authenticated, ce que
-- l'advisor de Supabase signale. Une fonction event_trigger ne peut pas être appelée directement,
-- mais on retire quand même le droit, comme pour nos autres fonctions security definer.
-- L'event trigger continue de marcher : PostgreSQL ne vérifie pas EXECUTE à son déclenchement.
-- Conditionnel : la fonction n'existe pas dans une base vierge (tests locaux avec PGlite).
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
