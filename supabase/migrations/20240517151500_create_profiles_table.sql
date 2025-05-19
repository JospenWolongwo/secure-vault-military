-- Create a profiles table to store additional user information
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text,
  last_name text,
  military_id text unique,
  rank text,
  unit text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(military_id) >= 6)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table public.profiles enable row level security;

-- Create policies for the profiles table
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create a function to handle new user signups
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, military_id, rank, unit)
  values (
    new.id, 
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'military_id',
    new.raw_user_meta_data->>'rank',
    new.raw_user_meta_data->>'unit'
  );
  return new;
exception when others then
  -- Log the error but don't fail the user registration
  raise warning 'Error creating profile: %', sqlerrm;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a view for user profiles
create or replace view public.user_profiles as
  select 
    users.id,
    users.email,
    users.email_confirmed_at,
    users.last_sign_in_at,
    profiles.first_name,
    profiles.last_name,
    profiles.military_id,
    profiles.rank,
    profiles.unit,
    profiles.created_at,
    profiles.updated_at
  from auth.users
  left join public.profiles on users.id = profiles.id;
