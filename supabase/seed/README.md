# Supabase Seed Data

This directory contains SQL seed files to populate your Supabase database with initial data for testing and development.

## Files

1. `01_update_admin_user.sql` - Updates the user Jospen Wolongwo to have admin role
2. `02_create_announcements.sql` - Creates sample announcements with different priorities and statuses

## How to Apply Seed Data

### Method 1: Using Supabase CLI

If you have the Supabase CLI installed, you can apply the seed data with:

```bash
supabase db reset
```

This will reset your database and apply all migrations and seed data.

### Method 2: Manual Execution

1. Connect to your Supabase database using the SQL Editor in the Supabase Dashboard
2. Open each SQL file in this directory
3. Copy the contents and execute them in the SQL Editor

### Method 3: Using psql

If you have direct access to the database:

```bash
psql -h [host] -p [port] -d [database] -U [user] -f 01_update_admin_user.sql
psql -h [host] -p [port] -d [database] -U [user] -f 02_create_announcements.sql
```

## Order of Execution

Make sure to execute the seed files in numerical order:

1. First run `01_update_admin_user.sql`
2. Then run `02_create_announcements.sql`

This ensures that the admin user is available before creating announcements associated with that user.
