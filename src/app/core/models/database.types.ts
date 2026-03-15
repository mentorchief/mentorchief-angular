/**
 * Supabase database type definitions.
 * Mirrors the DB schema defined in supabase/schema.sql
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'mentee' | 'mentor' | 'admin';
          avatar: string | null;
          registered: boolean;
          phone: string | null;
          location: string | null;
          gender: string | null;
          job_title: string | null;
          company: string | null;
          years_of_experience: string | null;
          bio: string | null;
          skills: string[] | null;
          tools: string[] | null;
          portfolio_url: string | null;
          linkedin: string | null;
          subscription_cost: string | null;
          mentor_plans: Json | null;
          availability: string[] | null;
          mentee_capacity: string | null;
          mentor_approval_status: 'pending' | 'approved' | 'rejected' | null;
          status: 'active' | 'suspended' | 'pending';
          join_date: string | null;
          experiences: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      conversations: {
        Row: {
          id: string;
          mentor_id: string;
          mentee_id: string;
          last_message: string | null;
          last_timestamp: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };

      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          text: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };

      mentor_unread: {
        Row: {
          conversation_id: string;
          mentor_id: string;
          unread_count: number;
        };
        Insert: Database['public']['Tables']['mentor_unread']['Row'];
        Update: Partial<Database['public']['Tables']['mentor_unread']['Row']>;
      };

      mentee_reports: {
        Row: {
          id: string;
          mentee_id: string;
          mentor_id: string;
          mentor_name: string;
          summary: string;
          rating: number;
          behaviour: string;
          strengths: string[];
          weaknesses: string[];
          areas_to_develop: string[];
          recommendations: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mentee_reports']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['mentee_reports']['Insert']>;
      };

      mentor_reviews: {
        Row: {
          id: string;
          mentor_id: string;
          mentee_id: string;
          rating: number;
          comment: string | null;
          submitted_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mentor_reviews']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['mentor_reviews']['Insert']>;
      };

      payments: {
        Row: {
          id: string;
          mentee_id: string;
          mentor_id: string;
          amount: number;
          currency: string;
          status: 'pending_confirmation' | 'in_escrow' | 'released' | 'refunded' | 'disputed';
          payment_reference: string | null;
          payment_proof_url: string | null;
          plan_name: string | null;
          month: string | null;
          release_date: string | null;
          paid_to_mentor: boolean;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };

      subscriptions: {
        Row: {
          id: string;
          mentee_id: string;
          mentor_id: string;
          plan_name: string;
          amount: number;
          currency: string;
          status: 'active' | 'cancelled' | 'past_due';
          next_billing_date: string | null;
          started_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };

      mentorships: {
        Row: {
          id: string;
          mentee_id: string;
          mentor_id: string;
          status: 'pending' | 'active' | 'completed' | 'cancelled';
          goal: string | null;
          message: string | null;
          progress: number;
          months_active: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mentorships']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['mentorships']['Insert']>;
      };
    };
  };
}
