export type Database = {
  public: {
    Tables: {
      daily_logs: {
        Row: {
          id: string;
          date: string;
          fajr: boolean;
          dhuhr: boolean;
          asr: boolean;
          maghrib: boolean;
          isha: boolean;
          quran: boolean;
          exercise: boolean;
          deep_work: boolean;
          content_creation: boolean;
          outreach: boolean;
          win_log: string | null;
          tomorrow_task: string | null;
          day_complete: boolean;
          most_important_task: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          fajr?: boolean;
          dhuhr?: boolean;
          asr?: boolean;
          maghrib?: boolean;
          isha?: boolean;
          quran?: boolean;
          exercise?: boolean;
          deep_work?: boolean;
          content_creation?: boolean;
          outreach?: boolean;
          win_log?: string | null;
          tomorrow_task?: string | null;
          day_complete?: boolean;
          most_important_task?: string | null;
        };
        Update: {
          id?: string;
          date?: string;
          fajr?: boolean;
          dhuhr?: boolean;
          asr?: boolean;
          maghrib?: boolean;
          isha?: boolean;
          quran?: boolean;
          exercise?: boolean;
          deep_work?: boolean;
          content_creation?: boolean;
          outreach?: boolean;
          win_log?: string | null;
          tomorrow_task?: string | null;
          day_complete?: boolean;
          most_important_task?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          title: string;
          metric: string;
          target: number;
          current: number;
          timeline: string;
          status: 'active' | 'completed' | 'paused' | 'abandoned';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          metric: string;
          target: number;
          current?: number;
          timeline: string;
          status?: 'active' | 'completed' | 'paused' | 'abandoned';
        };
        Update: {
          title?: string;
          metric?: string;
          target?: number;
          current?: number;
          timeline?: string;
          status?: 'active' | 'completed' | 'paused' | 'abandoned';
        };
      };
      weekly_reviews: {
        Row: {
          id: string;
          week_start: string;
          goal_id: string;
          on_track: boolean;
          corrective_action: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          week_start: string;
          goal_id: string;
          on_track?: boolean;
          corrective_action?: string | null;
        };
        Update: {
          week_start?: string;
          goal_id?: string;
          on_track?: boolean;
          corrective_action?: string | null;
        };
      };
      pipeline: {
        Row: {
          id: string;
          name: string;
          stage: 'lead' | 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
          offer: string;
          value: number;
          last_action: string | null;
          last_action_date: string | null;
          next_action: string | null;
          next_action_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          stage: 'lead' | 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
          offer: string;
          value: number;
          last_action?: string | null;
          last_action_date?: string | null;
          next_action?: string | null;
          next_action_date?: string | null;
        };
        Update: {
          name?: string;
          stage?: 'lead' | 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
          offer?: string;
          value?: number;
          last_action?: string | null;
          last_action_date?: string | null;
          next_action?: string | null;
          next_action_date?: string | null;
        };
      };
      revenue: {
        Row: {
          id: string;
          month: string;
          consulting_revenue: number;
          product_revenue: number;
          total: number;
          target: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          month: string;
          consulting_revenue?: number;
          product_revenue?: number;
          target?: number;
        };
        Update: {
          month?: string;
          consulting_revenue?: number;
          product_revenue?: number;
          target?: number;
        };
      };
      linkedin_metrics: {
        Row: {
          id: string;
          date: string;
          followers: number;
          impressions: number;
          dms_sent: number;
          dms_received: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          followers?: number;
          impressions?: number;
          dms_sent?: number;
          dms_received?: number;
        };
        Update: {
          date?: string;
          followers?: number;
          impressions?: number;
          dms_sent?: number;
          dms_received?: number;
        };
      };
      curriculum: {
        Row: {
          id: string;
          book_title: string;
          month: string;
          chapter_current: number;
          chapter_total: number;
          application_log: string | null;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_title: string;
          month: string;
          chapter_current?: number;
          chapter_total: number;
          application_log?: string | null;
          completed?: boolean;
        };
        Update: {
          book_title?: string;
          month?: string;
          chapter_current?: number;
          chapter_total?: number;
          application_log?: string | null;
          completed?: boolean;
        };
      };
      product_metrics: {
        Row: {
          id: string;
          date: string;
          product_name: string;
          signups: number;
          conversions: number;
          mrr: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          product_name: string;
          signups?: number;
          conversions?: number;
          mrr?: number;
        };
        Update: {
          date?: string;
          product_name?: string;
          signups?: number;
          conversions?: number;
          mrr?: number;
        };
      };
      content_log: {
        Row: {
          id: string;
          date: string;
          platform: 'linkedin' | 'twitter' | 'newsletter' | 'blog' | 'youtube' | 'other';
          post_type: 'text' | 'carousel' | 'video' | 'article' | 'newsletter' | 'thread';
          pillar: string;
          title: string | null;
          impressions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          platform: 'linkedin' | 'twitter' | 'newsletter' | 'blog' | 'youtube' | 'other';
          post_type: 'text' | 'carousel' | 'video' | 'article' | 'newsletter' | 'thread';
          pillar: string;
          title?: string | null;
          impressions?: number;
        };
        Update: {
          date?: string;
          platform?: 'linkedin' | 'twitter' | 'newsletter' | 'blog' | 'youtube' | 'other';
          post_type?: 'text' | 'carousel' | 'video' | 'article' | 'newsletter' | 'thread';
          pillar?: string;
          title?: string | null;
          impressions?: number;
        };
      };
      sleep_tracker: {
        Row: {
          id: string;
          date: string;
          main_sleep_start: string;
          main_sleep_end: string;
          total_main_sleep_hours: number;
          nap_duration_minutes: number;
          optimal_sleep_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          main_sleep_start: string;
          main_sleep_end: string;
          nap_duration_minutes?: number;
          optimal_sleep_score?: number;
        };
        Update: {
          date?: string;
          main_sleep_start?: string;
          main_sleep_end?: string;
          nap_duration_minutes?: number;
          optimal_sleep_score?: number;
        };
      };
    };
    Functions: {
      analyze_sleep: {
        Args: { days_back?: number };
        Returns: {
          avg_sleep_hours: number;
          avg_bedtime_hour: number;
          avg_wake_hour: number;
          avg_nap_minutes: number;
          avg_score: number;
          best_score_day: string;
          worst_score_day: string;
          days_with_optimal_nap: number;
          days_with_excessive_nap: number;
          consistency_score: number;
          recommendation: string;
        };
      };
    };
  };
};

// Convenience types
export type DailyLog = Database['public']['Tables']['daily_logs']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];
export type WeeklyReview = Database['public']['Tables']['weekly_reviews']['Row'];
export type PipelineDeal = Database['public']['Tables']['pipeline']['Row'];
export type Revenue = Database['public']['Tables']['revenue']['Row'];
export type LinkedInMetric = Database['public']['Tables']['linkedin_metrics']['Row'];
export type CurriculumItem = Database['public']['Tables']['curriculum']['Row'];
export type ProductMetric = Database['public']['Tables']['product_metrics']['Row'];
export type ContentLogEntry = Database['public']['Tables']['content_log']['Row'];
export type SleepEntry = Database['public']['Tables']['sleep_tracker']['Row'];

export type HabitKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'quran' | 'exercise' | 'deep_work' | 'content_creation' | 'outreach';

export const HABIT_LABELS: Record<HabitKey, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  quran: 'Quran',
  exercise: 'Exercise',
  deep_work: 'Deep Work',
  content_creation: 'Content',
  outreach: 'Outreach',
};

export const HABIT_KEYS: HabitKey[] = [
  'fajr', 'dhuhr', 'asr', 'maghrib', 'isha',
  'quran', 'exercise', 'deep_work', 'content_creation', 'outreach',
];

export const PIPELINE_STAGES = ['lead', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: 'Lead',
  discovery: 'Discovery',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};
