export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          code: string
          created_at: string
          status: 'waiting' | 'active' | 'completed'
          host_player_id: string | null
          guest_player_id: string | null
          current_turn_player_id: string | null
          active_question_id: string | null
          active_category: string | null
          turn_number: number
          winner_player_id: string | null
          allow_category_choice: boolean
        }
        Insert: {
          id?: string
          code: string
          created_at?: string
          status?: 'waiting' | 'active' | 'completed'
          host_player_id?: string | null
          guest_player_id?: string | null
          current_turn_player_id?: string | null
          active_question_id?: string | null
          active_category?: string | null
          turn_number?: number
          winner_player_id?: string | null
          allow_category_choice?: boolean
        }
        Update: {
          id?: string
          code?: string
          created_at?: string
          status?: 'waiting' | 'active' | 'completed'
          host_player_id?: string | null
          guest_player_id?: string | null
          current_turn_player_id?: string | null
          active_question_id?: string | null
          active_category?: string | null
          turn_number?: number
          winner_player_id?: string | null
          allow_category_choice?: boolean
        }
      }
      game_players: {
        Row: {
          id: string
          game_id: string
          created_at: string
          user_id: string
          name: string
          role: 'host' | 'guest'
          score: number
          streak: number
          categories_completed: string[]
        }
        Insert: {
          id?: string
          game_id: string
          created_at?: string
          user_id: string
          name: string
          role: 'host' | 'guest'
          score?: number
          streak?: number
          categories_completed?: string[]
        }
        Update: {
          id?: string
          game_id?: string
          created_at?: string
          user_id?: string
          name?: string
          role?: 'host' | 'guest'
          score?: number
          streak?: number
          categories_completed?: string[]
        }
      }
      game_questions: {
        Row: {
          id: string
          game_id: string
          created_at: string
          category: string
          question_text: string
          choices: string[]
          correct_index: number
          quip_correct: string
          quip_wrong: string
          used_at_turn: number | null
          used_by_player_id: string | null
        }
        Insert: {
          id?: string
          game_id: string
          created_at?: string
          category: string
          question_text: string
          choices: string[]
          correct_index: number
          quip_correct: string
          quip_wrong: string
          used_at_turn?: number | null
          used_by_player_id?: string | null
        }
        Update: {
          id?: string
          game_id?: string
          created_at?: string
          category?: string
          question_text?: string
          choices?: string[]
          correct_index?: number
          quip_correct?: string
          quip_wrong?: string
          used_at_turn?: number | null
          used_by_player_id?: string | null
        }
      }
    }
    Views: {
      game_questions_public: {
        Row: {
          id: string
          game_id: string
          created_at: string
          category: string
          question_text: string
          choices: string[]
          quip_correct: string
          quip_wrong: string
        }
      }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
