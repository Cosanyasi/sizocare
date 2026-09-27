export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_ref: string
          id: string
          metadata: Json | null
          occurred_at: string | null
          purpose_code: string | null
          resource_ref: string
          result: string | null
        }
        Insert: {
          action: string
          actor_ref: string
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          purpose_code?: string | null
          resource_ref: string
          result?: string | null
        }
        Update: {
          action?: string
          actor_ref?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          purpose_code?: string | null
          resource_ref?: string
          result?: string | null
        }
        Relationships: []
      }
      boundary_redirect_events: {
        Row: {
          care_recipient_id: string
          category: string
          created_at: string | null
          id: string
          source: string | null
        }
        Insert: {
          care_recipient_id: string
          category: string
          created_at?: string | null
          id?: string
          source?: string | null
        }
        Update: {
          care_recipient_id?: string
          category?: string
          created_at?: string | null
          id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boundary_redirect_events_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      care_recipients: {
        Row: {
          age_band: string | null
          created_at: string | null
          deleted_at: string | null
          diagnosis_summary: string | null
          id: string
          owner_caregiver_id: string
          preferred_name: string | null
          relationship_to_caregiver: string | null
          status: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          age_band?: string | null
          created_at?: string | null
          deleted_at?: string | null
          diagnosis_summary?: string | null
          id?: string
          owner_caregiver_id: string
          preferred_name?: string | null
          relationship_to_caregiver?: string | null
          status?: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          age_band?: string | null
          created_at?: string | null
          deleted_at?: string | null
          diagnosis_summary?: string | null
          id?: string
          owner_caregiver_id?: string
          preferred_name?: string | null
          relationship_to_caregiver?: string | null
          status?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      case_facts: {
        Row: {
          care_recipient_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          embedding: string | null
          fact_category: string
          fact_type: string
          id: string
          provenance: string
          source_document_id: string | null
          status: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          care_recipient_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          embedding?: string | null
          fact_category: string
          fact_type: string
          id?: string
          provenance: string
          source_document_id?: string | null
          status: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          care_recipient_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          embedding?: string | null
          fact_category?: string
          fact_type?: string
          id?: string
          provenance?: string
          source_document_id?: string | null
          status?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "case_facts_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_facts_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      change_signals: {
        Row: {
          baseline_data_point_count: number | null
          baseline_period_end: string | null
          baseline_period_start: string | null
          care_recipient_id: string
          category: string
          created_at: string | null
          direction: string | null
          id: string
          recent_data_point_count: number | null
          recent_period_end: string | null
          recent_period_start: string | null
          rule_version: string
          status: string | null
        }
        Insert: {
          baseline_data_point_count?: number | null
          baseline_period_end?: string | null
          baseline_period_start?: string | null
          care_recipient_id: string
          category: string
          created_at?: string | null
          direction?: string | null
          id?: string
          recent_data_point_count?: number | null
          recent_period_end?: string | null
          recent_period_start?: string | null
          rule_version: string
          status?: string | null
        }
        Update: {
          baseline_data_point_count?: number | null
          baseline_period_end?: string | null
          baseline_period_start?: string | null
          care_recipient_id?: string
          category?: string
          created_at?: string | null
          direction?: string | null
          id?: string
          recent_data_point_count?: number | null
          recent_period_end?: string | null
          recent_period_start?: string | null
          rule_version?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_signals_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_summaries: {
        Row: {
          care_recipient_id: string
          content: Json
          created_at: string | null
          id: string
          period_end: string | null
          period_start: string | null
          status: string | null
          superseded_by: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          care_recipient_id: string
          content: Json
          created_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          superseded_by?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          care_recipient_id?: string
          content?: Json
          created_at?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          superseded_by?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_summaries_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_summaries_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "clinical_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          caregiver_id: string
          consent_type: string
          granted_at: string
          id: string
          revoked_at: string | null
          version: number
        }
        Insert: {
          caregiver_id: string
          consent_type: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          version?: number
        }
        Update: {
          caregiver_id?: string
          consent_type?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          version?: number
        }
        Relationships: []
      }
      conversations: {
        Row: {
          care_recipient_id: string
          caregiver_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          policy_version: string
          status: string
          title: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          care_recipient_id: string
          caregiver_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          policy_version: string
          status?: string
          title?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          care_recipient_id?: string
          caregiver_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          policy_version?: string
          status?: string
          title?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_resources: {
        Row: {
          contact: string
          country_code: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          contact: string
          country_code: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          contact?: string
          country_code?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      daily_log_history: {
        Row: {
          archived_at: string | null
          category: string
          free_text: string | null
          id: string
          intensity_rating: number | null
          log_id: string
          observed_at: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          category: string
          free_text?: string | null
          id?: string
          intensity_rating?: number | null
          log_id: string
          observed_at: string
          version: number
        }
        Update: {
          archived_at?: string | null
          category?: string
          free_text?: string | null
          id?: string
          intensity_rating?: number | null
          log_id?: string
          observed_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_history_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          author_caregiver_id: string
          care_recipient_id: string
          category: string
          created_at: string | null
          edited_at: string | null
          free_text: string | null
          id: string
          intensity_rating: number | null
          observed_at: string
          status: string | null
          version: number | null
        }
        Insert: {
          author_caregiver_id: string
          care_recipient_id: string
          category: string
          created_at?: string | null
          edited_at?: string | null
          free_text?: string | null
          id?: string
          intensity_rating?: number | null
          observed_at: string
          status?: string | null
          version?: number | null
        }
        Update: {
          author_caregiver_id?: string
          care_recipient_id?: string
          category?: string
          created_at?: string | null
          edited_at?: string | null
          free_text?: string | null
          id?: string
          intensity_rating?: number | null
          observed_at?: string
          status?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_processing_consent_id: string | null
          care_recipient_id: string
          created_at: string | null
          deleted_at: string | null
          file_type: string | null
          id: string
          ocr_confidence: number | null
          size_bytes: number | null
          status: string | null
          storage_path: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          ai_processing_consent_id?: string | null
          care_recipient_id: string
          created_at?: string | null
          deleted_at?: string | null
          file_type?: string | null
          id?: string
          ocr_confidence?: number | null
          size_bytes?: number | null
          status?: string | null
          storage_path: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          ai_processing_consent_id?: string | null
          care_recipient_id?: string
          created_at?: string | null
          deleted_at?: string | null
          file_type?: string | null
          id?: string
          ocr_confidence?: number | null
          size_bytes?: number | null
          status?: string | null
          storage_path?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_ai_processing_consent_id_fkey"
            columns: ["ai_processing_consent_id"]
            isOneToOne: false
            referencedRelation: "consent_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_waitlist: {
        Row: { caregiver_id: string; created_at: string; email: string; feature: string; id: string }
        Insert: { caregiver_id: string; created_at?: string; email: string; feature: string; id?: string }
        Update: { caregiver_id?: string; created_at?: string; email?: string; feature?: string; id?: string }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          caregiver_id: string
          created_at: string | null
          expires_at: string
          id: string
          key: string
          request_hash: string
          response_body: Json | null
          response_status: number | null
          route: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          key: string
          request_hash: string
          response_body?: Json | null
          response_status?: number | null
          route: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          key?: string
          request_hash?: string
          response_body?: Json | null
          response_status?: number | null
          route?: string
        }
        Relationships: []
      }
      medication_events: {
        Row: {
          created_at: string | null
          id: string
          logged_after_discontinuation: boolean | null
          medication_id: string
          occurred_at: string
          side_effect_note: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logged_after_discontinuation?: boolean | null
          medication_id: string
          occurred_at: string
          side_effect_note?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logged_after_discontinuation?: boolean | null
          medication_id?: string
          occurred_at?: string
          side_effect_note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_events_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          care_recipient_id: string
          caregiver_entered_schedule: string
          created_at: string | null
          discontinued_at: string | null
          id: string
          name: string
          start_date: string
          status: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          care_recipient_id: string
          caregiver_entered_schedule: string
          created_at?: string | null
          discontinued_at?: string | null
          id?: string
          name: string
          start_date: string
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          care_recipient_id?: string
          caregiver_entered_schedule?: string
          created_at?: string | null
          discontinued_at?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          boundary_redirect_category: string | null
          content: string
          conversation_id: string
          created_at: string | null
          crisis_flagged: boolean
          id: string
          role: string
        }
        Insert: {
          boundary_redirect_category?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          crisis_flagged?: boolean
          id?: string
          role: string
        }
        Update: {
          boundary_redirect_category?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          crisis_flagged?: boolean
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_state: {
        Row: {
          caregiver_id: string
          case_content_added: boolean | null
          created_at: string | null
          disclaimer_acknowledged: boolean | null
          disclaimer_acknowledged_at: string | null
          id: string
          is_adult: boolean
          is_family_or_trusted_supporter: boolean
          status: string | null
          updated_at: string | null
        }
        Insert: {
          caregiver_id: string
          case_content_added?: boolean | null
          created_at?: string | null
          disclaimer_acknowledged?: boolean | null
          disclaimer_acknowledged_at?: string | null
          id?: string
          is_adult?: boolean
          is_family_or_trusted_supporter?: boolean
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          caregiver_id?: string
          case_content_added?: boolean | null
          created_at?: string | null
          disclaimer_acknowledged?: boolean | null
          disclaimer_acknowledged_at?: string | null
          id?: string
          is_adult?: boolean
          is_family_or_trusted_supporter?: boolean
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      risk_events: {
        Row: {
          care_recipient_id: string
          country_code: string | null
          created_at: string | null
          false_positive_reported: boolean | null
          id: string
          source: string | null
        }
        Insert: {
          care_recipient_id: string
          country_code?: string | null
          created_at?: string | null
          false_positive_reported?: boolean | null
          id?: string
          source?: string | null
        }
        Update: {
          care_recipient_id?: string
          country_code?: string | null
          created_at?: string | null
          false_positive_reported?: boolean | null
          id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_events_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_disclaimer: {
        Args: { p_is_adult: boolean; p_is_family_or_trusted_supporter: boolean }
        Returns: {
          caregiver_id: string
          case_content_added: boolean | null
          created_at: string | null
          disclaimer_acknowledged: boolean | null
          disclaimer_acknowledged_at: string | null
          id: string
          is_adult: boolean
          is_family_or_trusted_supporter: boolean
          status: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "onboarding_state"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_case_profile: {
        Args: {
          p_age_band: string
          p_diagnosis_summary: string
          p_preferred_name: string
          p_relationship: string
          p_story: string
        }
        Returns: {
          age_band: string | null
          created_at: string | null
          deleted_at: string | null
          diagnosis_summary: string | null
          id: string
          owner_caregiver_id: string
          preferred_name: string | null
          relationship_to_caregiver: string | null
          status: string
          updated_at: string | null
          version: number | null
        }
        SetofOptions: {
          from: "*"
          to: "care_recipients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      join_feature_waitlist: {
        Args: { p_email: string; p_feature: string }
        Returns: boolean
      }
      queue_document: {
        Args: { p_document_id: string }
        Returns: Database['public']['Tables']['documents']['Row']
      }
      reserve_document_upload: {
        Args: { p_file_type: string; p_original_filename: string; p_size_bytes: number }
        Returns: Database['public']['Tables']['documents']['Row']
      }
      start_new_conversation: {
        Args: never
        Returns: Database['public']['Tables']['conversations']['Row']
      }
      create_daily_log: {
        Args: {
          p_category: string
          p_free_text: string
          p_intensity_rating: number
          p_observed_at: string
        }
        Returns: {
          author_caregiver_id: string
          care_recipient_id: string
          category: string
          created_at: string | null
          edited_at: string | null
          free_text: string | null
          id: string
          intensity_rating: number | null
          observed_at: string
          status: string | null
          version: number | null
        }
        SetofOptions: {
          from: "*"
          to: "daily_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_medication: {
        Args: { p_name: string; p_schedule: string; p_start_date: string }
        Returns: {
          care_recipient_id: string
          caregiver_entered_schedule: string
          created_at: string | null
          discontinued_at: string | null
          id: string
          name: string
          start_date: string
          status: string | null
          updated_at: string | null
          version: number | null
        }
        SetofOptions: {
          from: "*"
          to: "medications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      discontinue_medication: {
        Args: { p_medication_id: string }
        Returns: {
          care_recipient_id: string
          caregiver_entered_schedule: string
          created_at: string | null
          discontinued_at: string | null
          id: string
          name: string
          start_date: string
          status: string | null
          updated_at: string | null
          version: number | null
        }
        SetofOptions: {
          from: "*"
          to: "medications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      grant_ai_processing_consent: {
        Args: never
        Returns: {
          caregiver_id: string
          consent_type: string
          granted_at: string
          id: string
          revoked_at: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "consent_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      persist_companion_exchange: {
        Args: {
          p_assistant_content: string
          p_boundary_category?: string
          p_crisis_flagged: boolean
          p_user_content: string
        }
        Returns: {
          care_recipient_id: string
          caregiver_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          policy_version: string
          status: string
          title: string | null
          updated_at: string | null
          version: number | null
        }
        SetofOptions: {
          from: "*"
          to: "conversations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_medication_event: {
        Args: {
          p_confirm_after_discontinuation?: boolean
          p_medication_id: string
          p_occurred_at: string
          p_side_effect_note: string
          p_status: string
        }
        Returns: {
          created_at: string | null
          id: string
          logged_after_discontinuation: boolean | null
          medication_id: string
          occurred_at: string
          side_effect_note: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "medication_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_ai_processing_consent: {
        Args: never
        Returns: {
          caregiver_id: string
          consent_type: string
          granted_at: string
          id: string
          revoked_at: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "consent_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

