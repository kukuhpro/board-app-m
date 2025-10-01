# Database Migrations

This directory contains SQL migration files for the Supabase database.

## Migration Files

- `001_create_jobs_table.sql` - Creates the jobs table with indexes and RLS policies

## Running Migrations

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each migration file
4. Execute the SQL

### Option 2: Supabase CLI (if configured)
```bash
supabase db push
```

### Option 3: Direct Connection
If you have a direct database connection string:
```bash
psql <connection-string> -f supabase/migrations/001_create_jobs_table.sql
```

## Table Structure

### Jobs Table
- `id` - UUID primary key
- `title` - Job title (max 100 chars)
- `company` - Company name (max 100 chars)
- `description` - Job description (max 5000 chars)
- `location` - Job location (max 100 chars)
- `job_type` - Enum: 'Full-Time', 'Part-Time', 'Contract'
- `user_id` - Foreign key to auth.users
- `created_at` - Timestamp with timezone
- `updated_at` - Timestamp with timezone (auto-updated)

## Row Level Security (RLS) Policies

1. **Select** - Anyone can view jobs
2. **Insert** - Only authenticated users can create jobs (user_id must match auth.uid())
3. **Update** - Users can only update their own jobs
4. **Delete** - Users can only delete their own jobs

## Indexes

- `idx_jobs_user_id` - For filtering by user
- `idx_jobs_location` - For location-based filtering
- `idx_jobs_type` - For job type filtering
- `idx_jobs_created_at` - For sorting by date (descending)