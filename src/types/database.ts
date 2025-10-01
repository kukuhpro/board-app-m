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
      jobs: {
        Row: {
          id: string
          title: string
          company: string
          description: string
          location: string
          job_type: 'Full-Time' | 'Part-Time' | 'Contract'
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          company: string
          description: string
          location: string
          job_type: 'Full-Time' | 'Part-Time' | 'Contract'
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          company?: string
          description?: string
          location?: string
          job_type?: 'Full-Time' | 'Part-Time' | 'Contract'
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      job_type: 'Full-Time' | 'Part-Time' | 'Contract'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}