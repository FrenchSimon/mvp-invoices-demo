-- Point 12 : liste des inscrits pour l'admin (plan, nombre de factures).
-- Les règles RLS empêchent un compte de lire les profils des autres : cette
-- fonction security definer lit tout, mais refuse quiconque n'est pas admin.
create function public.admin_list_users()
returns table (
  id uuid,
  email text,
  company_name text,
  plan text,
  role text,
  created_at timestamptz,
  invoice_count bigint,
  invoices_this_month bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.email,
    p.company_name,
    p.plan,
    p.role,
    p.created_at,
    count(i.id) as invoice_count,
    -- Même mois que la limite du plan gratuit (mois calendaire de la base).
    count(i.id) filter (
      where i.created_at >= date_trunc('month', now())
    ) as invoices_this_month
  from public.profiles p
  left join public.invoices i on i.user_id = p.id
  group by p.id
  order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
