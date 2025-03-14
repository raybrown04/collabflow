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
      event_projects: {
        Row: {
          id: string
          event_id: string
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          project_id: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          project_id?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_tags: {
        Row: {
          id: string
          task_id: string
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          project_id: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          project_id?: string
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'system'
          notification_email: boolean
          notification_push: boolean
          notification_calendar_reminders: boolean
          notification_task_reminders: boolean
          date_format: string
          time_format: string
          first_day_of_week: number
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'system'
          notification_email?: boolean
          notification_push?: boolean
          notification_calendar_reminders?: boolean
          notification_task_reminders?: boolean
          date_format?: string
          time_format?: string
          first_day_of_week?: number
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: 'light' | 'dark' | 'system'
          notification_email?: boolean
          notification_push?: boolean
          notification_calendar_reminders?: boolean
          notification_task_reminders?: boolean
          date_format?: string
          time_format?: string
          first_day_of_week?: number
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          type: 'meeting' | 'task' | 'reminder'
          created_at: string
          user_id: string
          end_date: string | null
          is_all_day: boolean | null
          location: string | null
          location_coordinates: {
            lat: number
            lng: number
          } | null
          invitees: string[] | null
          recurrence_rule: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          type: 'meeting' | 'task' | 'reminder'
          created_at?: string
          user_id: string
          end_date?: string | null
          is_all_day?: boolean | null
          location?: string | null
          location_coordinates?: {
            lat: number
            lng: number
          } | null
          invitees?: string[] | null
          recurrence_rule?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          type?: 'meeting' | 'task' | 'reminder'
          created_at?: string
          user_id?: string
          end_date?: string | null
          is_all_day?: boolean | null
          location?: string | null
          location_coordinates?: {
            lat: number
            lng: number
          } | null
          invitees?: string[] | null
          recurrence_rule?: string | null
          updated_at?: string | null
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
      get_user_settings: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      get_users: {
        Args: Record<string, never>
        Returns: {
          id: string
          email: string
        }[]
      }
      get_task_projects: {
        Args: {
          p_task_id: string
        }
        Returns: {
          id: string
          name: string
          description: string | null
          color: string
          user_id: string
          created_at: string
          updated_at: string
        }[]
      }
      get_project_tasks: {
        Args: {
          p_project_id: string
        }
        Returns: {
          task_id: string
        }[]
      }
      get_event_projects: {
        Args: {
          p_event_id: string
        }
        Returns: {
          id: string
          name: string
          description: string | null
          color: string
          user_id: string
          created_at: string
          updated_at: string
        }[]
      }
      get_project_events: {
        Args: {
          p_project_id: string
        }
        Returns: {
          event_id: string
        }[]
      }
    }
    Enums: {
      auth_role: 'admin' | 'user'
    }
  }
}
