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
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string
          role: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          role?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      traffic_uploads: {
        Row: {
          id: string
          file_url: string
          file_name: string
          file_type: 'image' | 'video'
          file_size: number | null
          uploaded_by: string | null
          junction_name: string | null
          status: 'pending' | 'analyzing' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          file_url: string
          file_name: string
          file_type: 'image' | 'video'
          file_size?: number | null
          uploaded_by?: string | null
          junction_name?: string | null
          status?: 'pending' | 'analyzing' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'analyzing' | 'completed' | 'failed'
        }
      }
      traffic_analysis: {
        Row: {
          id: string
          upload_id: string | null
          vehicle_count: number
          car_count: number
          bike_count: number
          bus_count: number
          truck_count: number
          density_level: 'low' | 'medium' | 'high' | 'critical'
          congestion_score: number
          suggested_signal_time: number
          emergency_detected: boolean
          emergency_vehicle_type: string | null
          ai_recommendation: string | null
          raw_ai_response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          upload_id?: string | null
          vehicle_count: number
          car_count: number
          bike_count: number
          bus_count: number
          truck_count: number
          density_level: 'low' | 'medium' | 'high' | 'critical'
          congestion_score: number
          suggested_signal_time: number
          emergency_detected?: boolean
          emergency_vehicle_type?: string | null
          ai_recommendation?: string | null
          raw_ai_response?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['traffic_analysis']['Insert']>
      }
      junction_status: {
        Row: {
          id: string
          junction_name: string
          lane_a_count: number
          lane_b_count: number
          lane_c_count: number
          lane_d_count: number
          active_green_lane: 'A' | 'B' | 'C' | 'D'
          current_signal_time: number
          congestion_level: 'low' | 'medium' | 'high' | 'critical'
          emergency_override: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          junction_name: string
          lane_a_count?: number
          lane_b_count?: number
          lane_c_count?: number
          lane_d_count?: number
          active_green_lane?: 'A' | 'B' | 'C' | 'D'
          current_signal_time?: number
          congestion_level?: 'low' | 'medium' | 'high' | 'critical'
          emergency_override?: boolean
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['junction_status']['Insert']>
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type TrafficUpload = Database['public']['Tables']['traffic_uploads']['Row']
export type TrafficAnalysis = Database['public']['Tables']['traffic_analysis']['Row']
export type JunctionStatus = Database['public']['Tables']['junction_status']['Row']
