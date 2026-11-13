-- Les fonctions security definer ne doivent pas être appelables par l'API (/rest/v1/rpc).
-- Les fonctions de trigger continuent de marcher : PostgreSQL ne vérifie pas le droit
-- EXECUTE quand un trigger s'exécute.
revoke execute on function public.before_invoice_insert() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- is_admin() reste utilisable par les comptes connectés (contrôles admin à venir),
-- plus par les visiteurs non connectés.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
