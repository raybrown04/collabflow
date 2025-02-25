export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      calendar_events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          type: 'meeting' | 'task' | 'reminder'
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          type: 'meeting' | 'task' | 'reminder'
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          type?: 'meeting' | 'task' | 'reminder'
          created_at?: string
          user_id?: string
        }
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
  }
}
