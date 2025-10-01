-- Migration: RLS Policies for leads_pipeline
-- Description: Enables Row Level Security and creates basic policies
-- Created: 2024-01-01

-- Enable Row Level Security
ALTER TABLE public.leads_pipeline ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all leads
CREATE POLICY "Allow authenticated users to view leads"
  ON public.leads_pipeline
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert leads
CREATE POLICY "Allow authenticated users to insert leads"
  ON public.leads_pipeline
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update leads
CREATE POLICY "Allow authenticated users to update leads"
  ON public.leads_pipeline
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete leads
CREATE POLICY "Allow authenticated users to delete leads"
  ON public.leads_pipeline
  FOR DELETE
  TO authenticated
  USING (true);

-- Optional: Service role bypass (for server-side operations)
-- This allows your backend services to bypass RLS
CREATE POLICY "Service role has full access"
  ON public.leads_pipeline
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.leads_pipeline IS 'RLS enabled: Authenticated users have full CRUD access';