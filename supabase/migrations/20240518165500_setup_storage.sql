-- Enable the pg_net extension for HTTP requests
create extension if not exists http with schema extensions;

-- Create storage buckets if they don't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'documents', 'documents', false, 52428800, '{
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/gif",
    "text/plain"
  }'::text[]
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'avatars', 'avatars', true, 1048576, '{
    "image/jpeg",
    "image/png",
    "image/gif"
  }'::text[]
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

-- Set up storage policies for documents bucket if they don't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
    create policy "Users can view their own documents"
    on storage.objects for select
    to authenticated
    using (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
    create policy "Users can upload their own documents"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
    create policy "Users can update their own documents"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own documents' AND tablename = 'objects' AND schemaname = 'storage') THEN
    create policy "Users can delete their own documents"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'documents' AND auth.uid() = (storage.foldername(name))[1]::uuid);
  END IF;

  -- Set up storage policies for avatars bucket
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar images are publicly accessible' AND tablename = 'objects' AND schemaname = 'storage') THEN
    create policy "Avatar images are publicly accessible"
    on storage.objects for select
    to public
    using (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatar' AND tablename = 'objects' AND schemaname = 'storage') THEN
    create policy "Users can upload their own avatar"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'avatars' AND auth.uid()::text = storage.filename(name));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatar' AND tablename = 'objects' AND schemaname = 'storage') THEN
    create policy "Users can update their own avatar"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'avatars' AND auth.uid()::text = storage.filename(name));
  END IF;
END
$$;

-- Create a function to handle file uploads with proper path structure
create or replace function handle_file_upload()
returns trigger as $$
begin
  -- For documents, store in /user_id/filename
  if new.bucket_id = 'documents' then
    new.name := new.owner::text || '/' || new.name;
  -- For avatars, store as user_id.extension
  elsif new.bucket_id = 'avatars' then
    new.name := new.owner::text || '.' || split_part(new.name, '.', 2);
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to handle file uploads if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_file_upload') THEN
    create trigger on_file_upload
      before insert on storage.objects
      for each row execute function handle_file_upload();
  END IF;
END
$$;

-- Create a function to get a user's storage quota (1GB by default)
create or replace function get_user_quota(user_id uuid)
returns bigint as $$
declare
  quota_bytes bigint := 1073741824; -- 1GB default
begin
  -- In the future, we can implement different quotas based on user roles
  return quota_bytes;
end;
$$ language plpgsql security definer;

-- Create a function to check if a user has enough storage space
create or replace function check_storage_quota()
returns trigger as $$
declare
  user_id uuid;
  used_bytes bigint;
  quota_bytes bigint;
  file_size bigint;
begin
  -- Get the user ID from the file path
  user_id := (string_to_array(new.name, '/'))[1]::uuid;
  
  -- Get the file size from metadata
  file_size := (new.metadata->>'size')::bigint;
  if file_size is null then
    file_size := 0;
  end if;
  
  -- Calculate current storage usage
  select coalesce(sum((metadata->>'size')::bigint), 0) into used_bytes
  from storage.objects
  where bucket_id = 'documents'
  and (storage.foldername(name))[1]::uuid = user_id;
  
  -- Get user's quota
  select get_user_quota(user_id) into quota_bytes;
  
  -- Check if adding the new file would exceed the quota
  if (used_bytes + file_size) > quota_bytes then
    raise exception 'Storage quota exceeded. Used: % bytes, Quota: % bytes', 
      used_bytes + file_size, quota_bytes;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Create a trigger to enforce storage quotas if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_storage_quota') THEN
    create trigger enforce_storage_quota
      before insert on storage.objects
      for each row 
      when (new.bucket_id = 'documents')
      execute function check_storage_quota();
  END IF;
END
$$;

-- Create a function to update the user's profile with their avatar URL
create or replace function update_user_avatar()
returns trigger as $$
begin
  if new.bucket_id = 'avatars' then
    update public.profiles
    set avatar_url = storage.url('avatars', new.name, '3600 seconds')
    where id = new.owner;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to update the user's profile when they upload an avatar if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_avatar_upload') THEN
    create trigger on_avatar_upload
      after insert on storage.objects
      for each row 
      when (new.bucket_id = 'avatars')
      execute function update_user_avatar();
  END IF;
END
$$;

-- Create a function to delete a file from storage
create or replace function delete_storage_object(bucket text, path text)
returns void as $$
declare
  status integer;
  response text;
  url text := 'http://localhost:54321/storage/v1/object/' || bucket || '/' || path;
  service_role_key text := 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; -- Replace with your service role key
begin
  select status, content::text into status, response
  from http(ARRAY[
    http_header('apikey', service_role_key),
    http_header('Authorization', 'Bearer ' || service_role_key)
  ], http_del(url));
  
  if status <> 200 then
    raise warning 'Failed to delete file: %', response;
  end if;
end;
$$ language plpgsql security definer;
