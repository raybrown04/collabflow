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
      events: {
        Row: {
          event_id: string
          title: string | null
          description: string | null
          event_date: string
          user_id: string
          created_at: string | null
        }
        Insert: {
          event_id?: string
          title?: string | null
          description?: string | null
          event_date: string
          user_id: string
          created_at?: string | null
        }
        Update: {
          event_id?: string
          title?: string | null
          description?: string | null
          event_date?: string
          user_id?: string
          created_at?: string | null
        }
      }
      todo_list: {
        Row: {
          id: number
          created_at: string
          title: string
          urgent: boolean
          description: string | null
          done: boolean
          done_at: string | null
          owner: string
        }
        Insert: {
          id?: number
          created_at?: string
          title: string
          urgent?: boolean
          description?: string | null
          done?: boolean
          done_at?: string | null
          owner: string
        }
        Update: {
          id?: number
          created_at?: string
          title?: string
          urgent?: boolean
          description?: string | null
          done?: boolean
          done_at?: string | null
          owner?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_user_role: {
        Args: {
          user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      auth_role: 'admin' | 'user'
    }
  }
}
