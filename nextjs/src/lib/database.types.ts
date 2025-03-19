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
      documents: {
        Row: {
          id: string
          name: string
          description: string | null
          file_path: string | null
          dropbox_path: string | null
          size: number | null
          mime_type: string | null
          is_synced: boolean
          last_synced: string | null
          external_url: string | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
        Insert: {
          id?: string
          name: string
          description?: string | null
          file_path?: string | null
          dropbox_path?: string | null
          size?: number | null
          mime_type?: string | null
          is_synced?: boolean
          last_synced?: string | null
          external_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          file_path?: string | null
          dropbox_path?: string | null
          size?: number | null
          mime_type?: string | null
          is_synced?: boolean
          last_synced?: string | null
          external_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      document_projects: {
        Row: {
          id: string
          document_id: string
          project_id: string
          created_at: string
          user_id: string
        }
        Relationships: [
          {
            foreignKeyName: "document_projects_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
        Insert: {
          id?: string
          document_id: string
          project_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          document_id?: string
          project_id?: string
          created_at?: string
          user_id?: string
        }
      }
      dropbox_auth: {
        Row: {
          id: string
          user_id: string
          access_token: string | null
          refresh_token: string | null
          account_id: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Relationships: [
          {
            foreignKeyName: "dropbox_auth_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
        Insert: {
          id?: string
          user_id: string
          access_token?: string | null
          refresh_token?: string | null
          account_id?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string | null
          refresh_token?: string | null
          account_id?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      document_versions: {
        Row: {
          id: string
          document_id: string
          version_number: number
          file_path: string
          size: number | null
          created_at: string
          user_id: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
        Insert: {
          id?: string
          document_id: string
          version_number: number
          file_path: string
          size?: number | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          document_id?: string
          version_number?: number
          file_path?: string
          size?: number | null
          created_at?: string
          user_id?: string
        }
      }
      document_sync_log: {
        Row: {
          id: string
          document_id: string
          operation: 'upload' | 'download' | 'delete' | 'rename' | 'move'
          status: 'success' | 'failed' | 'in_progress'
          error_message: string | null
          created_at: string
          user_id: string
        }
        Relationships: [
          {
            foreignKeyName: "document_sync_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sync_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
        Insert: {
          id?: string
          document_id: string
          operation: 'upload' | 'download' | 'delete' | 'rename' | 'move'
          status: 'success' | 'failed' | 'in_progress'
          error_message?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          document_id?: string
          operation?: 'upload' | 'download' | 'delete' | 'rename' | 'move'
          status?: 'success' | 'failed' | 'in_progress'
          error_message?: string | null
          created_at?: string
          user_id?: string
        }
      }
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
      mcp_entities: {
        Row: {
          id: string
          name: string
          entity_type: string
          observations: string[] | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          entity_type: string
          observations?: string[] | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          entity_type?: string
          observations?: string[] | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_entities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mcp_relations: {
        Row: {
          id: string
          from_entity: string
          to_entity: string
          relation_type: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_entity: string
          to_entity: string
          relation_type: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_entity?: string
          to_entity?: string
          relation_type?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_relations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      user_has_document_access: {
        Args: {
          document_id: string
        }
        Returns: boolean
      }
      get_documents_by_project: {
        Args: {
          project_id: string
        }
        Returns: {
          id: string
          name: string
          description: string | null
          file_path: string | null
          dropbox_path: string | null
          size: number | null
          mime_type: string | null
          is_synced: boolean
          last_synced: string | null
          external_url: string | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
          user_id: string
        }[]
      }
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
