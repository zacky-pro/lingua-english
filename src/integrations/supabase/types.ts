export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          description: string
          icon: string
          id: string
          metric: string
          sort_order: number
          target: number
          title: string
        }
        Insert: {
          code: string
          description: string
          icon?: string
          id?: string
          metric: string
          sort_order?: number
          target?: number
          title: string
        }
        Update: {
          code?: string
          description?: string
          icon?: string
          id?: string
          metric?: string
          sort_order?: number
          target?: number
          title?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_scenarios: {
        Row: {
          description: string | null
          difficulty: string
          icon: string
          id: string
          opener: string
          partner_style: string
          situation: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          description?: string | null
          difficulty?: string
          icon?: string
          id?: string
          opener: string
          partner_style?: string
          situation: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          description?: string | null
          difficulty?: string
          icon?: string
          id?: string
          opener?: string
          partner_style?: string
          situation?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      conversation_sessions: {
        Row: {
          created_at: string
          difficulty: string
          ended_at: string | null
          id: string
          partner_style: string
          review: Json | null
          scenario_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          ended_at?: string | null
          id?: string
          partner_style?: string
          review?: Json | null
          scenario_id?: string | null
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          ended_at?: string | null
          id?: string
          partner_style?: string
          review?: Json | null
          scenario_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "conversation_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level_code: string
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level_code: string
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level_code?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          activity_date: string
          lessons_completed: number
          listening_minutes: number
          minutes: number
          speaking_minutes: number
          user_id: string
          words_reviewed: number
          xp: number
        }
        Insert: {
          activity_date?: string
          lessons_completed?: number
          listening_minutes?: number
          minutes?: number
          speaking_minutes?: number
          user_id: string
          words_reviewed?: number
          xp?: number
        }
        Update: {
          activity_date?: string
          lessons_completed?: number
          listening_minutes?: number
          minutes?: number
          speaking_minutes?: number
          user_id?: string
          words_reviewed?: number
          xp?: number
        }
        Relationships: []
      }
      exercises: {
        Row: {
          answer: string
          audio_text: string | null
          explanation: string | null
          id: string
          kind: string
          lesson_id: string
          options: Json
          prompt: string
          prompt_id: string | null
          sort_order: number
        }
        Insert: {
          answer: string
          audio_text?: string | null
          explanation?: string | null
          id?: string
          kind: string
          lesson_id: string
          options?: Json
          prompt: string
          prompt_id?: string | null
          sort_order?: number
        }
        Update: {
          answer?: string
          audio_text?: string | null
          explanation?: string | null
          id?: string
          kind?: string
          lesson_id?: string
          options?: Json
          prompt?: string
          prompt_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_topics: {
        Row: {
          examples: Json
          exercises: Json
          explanation: Json
          id: string
          level_code: string
          slug: string
          sort_order: number
          summary: string
          summary_id: string | null
          title: string
        }
        Insert: {
          examples?: Json
          exercises?: Json
          explanation?: Json
          id?: string
          level_code?: string
          slug: string
          sort_order?: number
          summary: string
          summary_id?: string | null
          title: string
        }
        Update: {
          examples?: Json
          exercises?: Json
          explanation?: Json
          id?: string
          level_code?: string
          slug?: string
          sort_order?: number
          summary?: string
          summary_id?: string | null
          title?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          accuracy: number
          completed_at: string | null
          id: string
          lesson_id: string
          seconds_spent: number
          status: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          accuracy?: number
          completed_at?: string | null
          id?: string
          lesson_id: string
          seconds_spent?: number
          status?: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          accuracy?: number
          completed_at?: string | null
          id?: string
          lesson_id?: string
          seconds_spent?: number
          status?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          estimated_minutes: number
          id: string
          level_code: string
          module_id: string
          objective: string | null
          objective_id: string | null
          skill: string
          slug: string
          sort_order: number
          teach: Json
          title: string
          xp_reward: number
        }
        Insert: {
          estimated_minutes?: number
          id?: string
          level_code?: string
          module_id: string
          objective?: string | null
          objective_id?: string | null
          skill?: string
          slug: string
          sort_order?: number
          teach?: Json
          title: string
          xp_reward?: number
        }
        Update: {
          estimated_minutes?: number
          id?: string
          level_code?: string
          module_id?: string
          objective?: string | null
          objective_id?: string | null
          skill?: string
          slug?: string
          sort_order?: number
          teach?: Json
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      listening_exercises: {
        Row: {
          id: string
          level_code: string
          questions: Json
          sort_order: number
          title: string
          transcript: string
          translation: string | null
        }
        Insert: {
          id?: string
          level_code?: string
          questions?: Json
          sort_order?: number
          title: string
          transcript: string
          translation?: string | null
        }
        Update: {
          id?: string
          level_code?: string
          questions?: Json
          sort_order?: number
          title?: string
          transcript?: string
          translation?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string
          description: string | null
          icon: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          description?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          description?: string | null
          icon?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_results: {
        Row: {
          breakdown: Json
          created_at: string
          id: string
          level_code: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          id?: string
          level_code: string
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          breakdown?: Json
          created_at?: string
          id?: string
          level_code?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_emoji: string
          created_at: string
          daily_goal_minutes: number
          display_name: string
          focus_skills: string[]
          goals: string[]
          id: string
          interface_language: string
          last_active_date: string | null
          leaderboard_opt_in: boolean
          level_code: string
          longest_streak: number
          notifications_enabled: boolean
          onboarded: boolean
          reduce_motion: boolean
          streak_count: number
          theme: string
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_emoji?: string
          created_at?: string
          daily_goal_minutes?: number
          display_name?: string
          focus_skills?: string[]
          goals?: string[]
          id: string
          interface_language?: string
          last_active_date?: string | null
          leaderboard_opt_in?: boolean
          level_code?: string
          longest_streak?: number
          notifications_enabled?: boolean
          onboarded?: boolean
          reduce_motion?: boolean
          streak_count?: number
          theme?: string
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_emoji?: string
          created_at?: string
          daily_goal_minutes?: number
          display_name?: string
          focus_skills?: string[]
          goals?: string[]
          id?: string
          interface_language?: string
          last_active_date?: string | null
          leaderboard_opt_in?: boolean
          level_code?: string
          longest_streak?: number
          notifications_enabled?: boolean
          onboarded?: boolean
          reduce_motion?: boolean
          streak_count?: number
          theme?: string
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string
          details: Json
          id: string
          kind: string
          lesson_id: string | null
          score: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          lesson_id?: string | null
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          lesson_id?: string | null
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_passages: {
        Row: {
          body: string
          glossary: Json
          id: string
          level_code: string
          questions: Json
          sort_order: number
          title: string
        }
        Insert: {
          body: string
          glossary?: Json
          id?: string
          level_code?: string
          questions?: Json
          sort_order?: number
          title: string
        }
        Update: {
          body?: string
          glossary?: Json
          id?: string
          level_code?: string
          questions?: Json
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      speaking_sessions: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          prompt: string
          scores: Json
          seconds: number
          transcript: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          prompt: string
          scores?: Json
          seconds?: number
          transcript: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          prompt?: string
          scores?: Json
          seconds?: number
          transcript?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vocabulary: {
        Row: {
          due_at: string
          ease: number
          favorite: boolean
          id: string
          interval_days: number
          lapses: number
          reps: number
          status: string
          updated_at: string
          user_id: string
          vocabulary_id: string
        }
        Insert: {
          due_at?: string
          ease?: number
          favorite?: boolean
          id?: string
          interval_days?: number
          lapses?: number
          reps?: number
          status?: string
          updated_at?: string
          user_id: string
          vocabulary_id: string
        }
        Update: {
          due_at?: string
          ease?: number
          favorite?: boolean
          id?: string
          interval_days?: number
          lapses?: number
          reps?: number
          status?: string
          updated_at?: string
          user_id?: string
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vocabulary_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          category: string
          created_at: string
          example: string | null
          example_id: string | null
          id: string
          ipa: string | null
          level_code: string
          meaning_en: string | null
          meaning_id: string
          word: string
          word_type: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          example?: string | null
          example_id?: string | null
          id?: string
          ipa?: string | null
          level_code?: string
          meaning_en?: string | null
          meaning_id: string
          word: string
          word_type?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          example?: string | null
          example_id?: string | null
          id?: string
          ipa?: string | null
          level_code?: string
          meaning_en?: string | null
          meaning_id?: string
          word?: string
          word_type?: string | null
        }
        Relationships: []
      }
      writing_prompts: {
        Row: {
          guidance: string | null
          id: string
          level_code: string
          min_words: number
          prompt: string
          sort_order: number
          title: string
        }
        Insert: {
          guidance?: string | null
          id?: string
          level_code?: string
          min_words?: number
          prompt: string
          sort_order?: number
          title: string
        }
        Update: {
          guidance?: string | null
          id?: string
          level_code?: string
          min_words?: number
          prompt?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      writing_submissions: {
        Row: {
          content: string
          created_at: string
          feedback: Json | null
          id: string
          prompt_id: string | null
          prompt_text: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          feedback?: Json | null
          id?: string
          prompt_id?: string | null
          prompt_text?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          feedback?: Json | null
          id?: string
          prompt_id?: string | null
          prompt_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "writing_submissions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "writing_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
