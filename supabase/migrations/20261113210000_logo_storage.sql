-- Point 10 : logo de l'entreprise sur le PDF (formule Pro).
-- Espace de stockage privé « logos » : un dossier par freelance (<user_id>/...).
-- PNG ou JPEG (les seuls formats que le PDF sait afficher), 500 Ko au plus.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', false, 512000, array['image/png', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Chacun ne voit que son dossier. Lecture et suppression restent possibles
-- après un retour à la formule gratuite (le PDF n'affiche plus le logo).
create policy "logos: lire le sien" on storage.objects
  for select to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "logos: supprimer le sien" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Envoyer un logo : seulement dans son dossier, et seulement en Pro.
create policy "logos: envoyer en Pro" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.plan = 'pro')
  );
