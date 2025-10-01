import { Lead } from './supabase';

export const getCurrentStage = (lead: Lead): string => {
  if (lead.day_4_sent) return 'Day 4 Sent';
  if (lead.day_3_sent) return 'Day 3 Sent';
  if (lead.day_2_sent) return 'Day 2 Sent';
  if (lead.day_1_sent) return 'Day 1 Sent';
  return 'Not Started';
};

export const getNextStage = (lead: Lead): string => {
  if (!lead.day_1_sent) return 'Awaiting Day 1';
  if (!lead.day_2_sent) return 'Awaiting Day 2';
  if (!lead.day_3_sent) return 'Awaiting Day 3';
  if (!lead.day_4_sent) return 'Awaiting Day 4';
  return 'Sequence Complete';
};