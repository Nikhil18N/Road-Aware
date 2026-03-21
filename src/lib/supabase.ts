import { createClient } from '@supabase/supabase-js';

// Environment variables - Create a .env file with these values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Report {
  id: string;
  complaint_id: string;
  reporter_name: string;
  reporter_phone: string;
  reporter_email?: string;
  damage_type: string;
  severity: 'low' | 'moderate' | 'critical';
  description?: string;
  location: string;
  landmark?: string;
  ward_id?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  image_url?: string;
  image_size?: string;
  status: 'pending' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
  assigned_team_id?: string;
  priority: number;
  reported_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface StatusTimeline {
  id: string;
  report_id: string;
  status: string;
  description: string;
  changed_at: string;
}

export interface Ward {
  id: string;
  ward_number: number;
  ward_name: string;
}

export interface Team {
  id: string;
  team_name: string;
  department: string;
  active: boolean;
}
