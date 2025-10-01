import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Lead = {
  id: string;
  email: string;
  username?: string;
  linkedin_url?: string;
  fullname?: string;
  company_name?: string;
  job_title?: string;
  repliq_video_id?: string;
  video_link?: string;
  video_thumbnail_url?: string;
  thread_id?: string;
  sent_status?: string;
  stage?: string;
  replied?: boolean;
  booked_meeting?: boolean;
  created_at?: string;
  last_updated_at?: string;
  campaign_id?: string;
  lead_source?: string;
  company_size?: string;
  industry?: string;
  pain_points?: any;
  personalization_data?: any;
  company_website?: string;
  day_1_sent?: boolean;
  day_2_sent?: boolean;
  day_3_sent?: boolean;
  day_4_sent?: boolean;
  booked?: boolean;
  day_1_msg_id?: string;
  day_2_msg_id?: string;
  day_3_msg_id?: string;
  day_4_msg_id?: string;
  day_1_subject?: string;
  day_2_subject?: string;
  day_3_subject?: string;
  day_4_subject?: string;
  day_1_body?: string;
  day_2_body?: string;
  day_3_body?: string;
  day_4_body?: string;
  day_1_reply?: boolean;
  day_2_reply?: boolean;
  day_3_reply?: boolean;
  day_4_reply?: boolean;
  day_1_sent_at?: string;
  day_2_sent_at?: string;
  day_3_sent_at?: string;
  day_4_sent_at?: string;
  booked_at?: string;
  linkedin_data?: any;
};