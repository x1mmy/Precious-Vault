import { createClient } from '@supabase/supabase-js'
import { env } from '~/env.js'

// Client-side Supabase client
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Server-side Supabase client with service role
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database types
export interface Database {
  public: {
    Tables: {
      holdings: {
        Row: {
          id: string
          user_id: string
          metal_type: 'gold' | 'silver'
          weight_oz: number
          form_type: 'bar' | 'coin'
          denomination: string
          quantity: number
          purchase_price_aud: number | null
          purchase_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          metal_type: 'gold' | 'silver'
          weight_oz: number
          form_type: 'bar' | 'coin'
          denomination: string
          quantity?: number
          purchase_price_aud?: number | null
          purchase_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          metal_type?: 'gold' | 'silver'
          weight_oz?: number
          form_type?: 'bar' | 'coin'
          denomination?: string
          quantity?: number
          purchase_price_aud?: number | null
          purchase_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      price_cache: {
        Row: {
          id: string
          metal_type: 'gold' | 'silver'
          price_aud: number
          updated_at: string
        }
        Insert: {
          id?: string
          metal_type: 'gold' | 'silver'
          price_aud: number
          updated_at?: string
        }
        Update: {
          id?: string
          metal_type?: 'gold' | 'silver'
          price_aud?: number
          updated_at?: string
        }
      }
      price_history: {
        Row: {
          id: string
          metal_type: 'gold' | 'silver'
          price_aud: number
          recorded_date: string
          created_at: string
        }
        Insert: {
          id?: string
          metal_type: 'gold' | 'silver'
          price_aud: number
          recorded_date: string
          created_at?: string
        }
        Update: {
          id?: string
          metal_type?: 'gold' | 'silver'
          price_aud?: number
          recorded_date?: string
          created_at?: string
        }
      }
    }
  }
}