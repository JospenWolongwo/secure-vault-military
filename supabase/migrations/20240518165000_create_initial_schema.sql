-- Create roles table
create table public.roles (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default roles
insert into public.roles (name, description) values
  ('admin', 'Administrator with full access'),
  ('officer', 'Commissioned officer'),
  ('nco', 'Non-commissioned officer'),
  ('soldier', 'Enlisted personnel');

-- Create user_roles join table
create table public.user_roles (
  user_id uuid references auth.users on delete cascade not null,
  role_id uuid references public.roles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, role_id)
);

-- Create document_categories table
create table public.document_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default document categories
insert into public.document_categories (name, description) values
  ('personnel', 'Personal identification and records'),
  ('military', 'Military service documents'),
  ('medical', 'Medical records and history'),
  ('family', 'Family and dependent information');

-- Create documents table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references public.document_categories on delete set null,
  title text not null,
  description text,
  file_path text not null,
  file_size bigint not null,
  file_type text not null,
  classification text not null default 'UNCLASSIFIED',
  is_encrypted boolean not null default true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create communications table
create table public.communications (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  category text,
  is_published boolean not null default false,
  published_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create communication_recipients join table
create table public.communication_recipients (
  communication_id uuid references public.communications on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  read_at timestamp with time zone,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (communication_id, user_id)
);

-- Create indexes for better query performance
create index idx_documents_user_id on public.documents(user_id);
create index idx_documents_category_id on public.documents(category_id);
create index idx_communications_created_by on public.communications(created_by);
create index idx_communications_is_published on public.communications(is_published) where is_published = true;
create index idx_communication_recipients_user_id on public.communication_recipients(user_id);

-- Set up Row Level Security (RLS) for all tables
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.document_categories enable row level security;
alter table public.documents enable row level security;
alter table public.communications enable row level security;
alter table public.communication_recipients enable row level security;

-- Create RLS policies for roles table
create policy "Roles are viewable by everyone." on public.roles
  for select using (true);

-- Create RLS policies for user_roles table
create policy "Users can view their own roles." on public.user_roles
  for select using (auth.uid() = user_id);

-- Create RLS policies for document_categories table
create policy "Document categories are viewable by everyone." on public.document_categories
  for select using (true);

-- Create RLS policies for documents table
create policy "Users can view their own documents." on public.documents
  for select using (auth.uid() = user_id);

create policy "Users can insert their own documents." on public.documents
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own documents." on public.documents
  for update using (auth.uid() = user_id);

create policy "Users can delete their own documents." on public.documents
  for delete using (auth.uid() = user_id);

-- Create RLS policies for communications table
create policy "Published communications are viewable by everyone." on public.communications
  for select using (is_published = true);

create policy "Users can view communications they created." on public.communications
  for select using (auth.uid() = created_by);

create policy "Admins can manage all communications." on public.communications
  for all using (exists (
    select 1 from public.user_roles ur
    join public.roles r on ur.role_id = r.id
    where ur.user_id = auth.uid() and r.name = 'admin'
  ));

-- Create RLS policies for communication_recipients table
create policy "Users can view their own communication recipients." on public.communication_recipients
  for select using (auth.uid() = user_id);

create policy "Users can update their own communication read status." on public.communication_recipients
  for update using (auth.uid() = user_id);

-- Create a function to check if a user has a specific role
create or replace function public.has_role(role_name text)
returns boolean as $$
begin
  return exists (
    select 1 from public.user_roles ur
    join public.roles r on ur.role_id = r.id
    where ur.user_id = auth.uid() and r.name = role_name
  );
end;
$$ language plpgsql security definer;
