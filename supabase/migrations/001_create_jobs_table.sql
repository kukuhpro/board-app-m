-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    company VARCHAR(100) NOT NULL,
    description TEXT NOT NULL CHECK (char_length(description) <= 5000),
    location VARCHAR(100) NOT NULL,
    job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('Full-Time', 'Part-Time', 'Contract')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON jobs;

-- Anyone can view jobs
CREATE POLICY "Jobs are viewable by everyone"
    ON jobs FOR SELECT
    USING (true);

-- Only authenticated users can create jobs
CREATE POLICY "Authenticated users can create jobs"
    ON jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own jobs
CREATE POLICY "Users can update own jobs"
    ON jobs FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only delete their own jobs
CREATE POLICY "Users can delete own jobs"
    ON jobs FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();