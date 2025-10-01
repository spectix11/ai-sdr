-- Migration: Triggers for leads_pipeline
-- Description: Auto-update last_updated_at timestamp on row updates
-- Created: 2024-01-01

-- Create function to update last_updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_updated_at
CREATE TRIGGER set_last_updated_at
  BEFORE UPDATE ON public.leads_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_updated_at();

-- Add comment
COMMENT ON FUNCTION public.update_last_updated_at() IS 'Automatically updates last_updated_at timestamp on row update';