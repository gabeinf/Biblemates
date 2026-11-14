-- Profile pictures. Stored at avatars/<user id>/avatar.jpg; the public URL is
-- saved on profiles.avatar_url. Users can only write inside their own folder.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists bm_avatars_select on storage.objects;
drop policy if exists bm_avatars_insert on storage.objects;
drop policy if exists bm_avatars_update on storage.objects;
drop policy if exists bm_avatars_delete on storage.objects;

create policy bm_avatars_select on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy bm_avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy bm_avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy bm_avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
