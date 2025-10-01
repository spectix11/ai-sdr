-- Migration: Initial Schema
-- Description: Creates the leads_pipeline table with all columns, constraints, and indexes
-- Created: 2024-01-01

-- Create leads_pipeline table
CREATE TABLE IF NOT EXISTS public.leads_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  linkedin_url TEXT NULL,
  fullname TEXT NULL,
  company_name TEXT NULL,
  job_title TEXT NULL,
  repliq_video_id TEXT NULL,
  video_link TEXT NULL,
  video_thumbnail_url TEXT NULL,
  sent_status TEXT NULL DEFAULT 'pending'::TEXT,
  stage TEXT NULL DEFAULT 'imported'::TEXT,
  replied BOOLEAN NULL DEFAULT FALSE,
  created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  last_updated_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  campaign_id TEXT NULL,
  lead_source TEXT NULL DEFAULT 'linkedin'::TEXT,
  company_size TEXT NULL,
  industry TEXT NULL,
  company_website TEXT NULL,
  day_1_sent BOOLEAN NULL DEFAULT FALSE,
  day_2_sent BOOLEAN NULL DEFAULT FALSE,
  day_3_sent BOOLEAN NULL DEFAULT FALSE,
  day_4_sent BOOLEAN NULL DEFAULT FALSE,
  booked BOOLEAN NULL DEFAULT FALSE,
  day_1_msg_id TEXT NULL,
  day_2_msg_id TEXT NULL,
  day_3_msg_id TEXT NULL,
  day_4_msg_id TEXT NULL,
  day_1_subject TEXT NULL,
  day_2_subject TEXT NULL,
  day_3_subject TEXT NULL,
  day_4_subject TEXT NULL,
  day_1_body TEXT NULL,
  day_2_body TEXT NULL,
  day_3_body TEXT NULL,
  day_4_body TEXT NULL,
  day_1_reply BOOLEAN NULL DEFAULT FALSE,
  day_2_reply BOOLEAN NULL DEFAULT FALSE,
  day_3_reply BOOLEAN NULL DEFAULT FALSE,
  day_4_reply BOOLEAN NULL DEFAULT FALSE,
  day_1_sent_at TIMESTAMP WITHOUT TIME ZONE NULL,
  day_2_sent_at TIMESTAMP WITHOUT TIME ZONE NULL,
  day_3_sent_at TIMESTAMP WITHOUT TIME ZONE NULL,
  day_4_sent_at TIMESTAMP WITHOUT TIME ZONE NULL,
  company_linkedin_data JSONB NULL,
  days BIGINT NULL DEFAULT 1::BIGINT,
  booked_at TIMESTAMP WITHOUT TIME ZONE NULL,
  analysis_doc_link TEXT NULL,
  analysis_doc_content TEXT NULL,
  web_scraping_protected BOOLEAN NOT NULL DEFAULT FALSE,
  no_commercial_mail BOOLEAN NULL DEFAULT FALSE,
  scraping_allowed BOOLEAN NULL DEFAULT TRUE,
  CONSTRAINT leads_pipeline_pkey PRIMARY KEY (id),
  CONSTRAINT leads_pipeline_email_key UNIQUE (email)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_leads_stage 
  ON public.leads_pipeline USING BTREE (stage);

CREATE INDEX IF NOT EXISTS idx_leads_repliq_video 
  ON public.leads_pipeline USING BTREE (repliq_video_id);

CREATE INDEX IF NOT EXISTS idx_leads_created_at 
  ON public.leads_pipeline USING BTREE (created_at);

CREATE INDEX IF NOT EXISTS idx_leads_day_1_sent 
  ON public.leads_pipeline USING BTREE (day_1_sent);

CREATE INDEX IF NOT EXISTS idx_leads_day_3_sent 
  ON public.leads_pipeline USING BTREE (day_2_sent);

CREATE INDEX IF NOT EXISTS idx_leads_day_5_sent 
  ON public.leads_pipeline USING BTREE (day_3_sent);

CREATE INDEX IF NOT EXISTS idx_leads_day_7_sent 
  ON public.leads_pipeline USING BTREE (day_4_sent);

CREATE INDEX IF NOT EXISTS idx_leads_booked 
  ON public.leads_pipeline USING BTREE (booked);

-- Add comment to table
COMMENT ON TABLE public.leads_pipeline IS 'Main table for managing lead pipeline and email campaign tracking';