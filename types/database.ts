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
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: 'Owner' | 'Manager' | 'Operator' | 'Viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: 'Owner' | 'Manager' | 'Operator' | 'Viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'Owner' | 'Manager' | 'Operator' | 'Viewer'
          created_at?: string
          updated_at?: string
        }
      }
      workspace_settings: {
        Row: {
          id: string
          user_id: string
          factory_name: string
          address: string | null
          phone: string | null
          email: string | null
          bank_details: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          factory_name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          bank_details?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          factory_name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          bank_details?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'export' | 'local'
          billing_currency: 'GBP' | 'PKR' | 'USD'
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          billing_address: string | null
          opening_balance: number
          opening_balance_date: string | null
          opening_balance_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: 'export' | 'local'
          billing_currency?: 'GBP' | 'PKR' | 'USD'
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          billing_address?: string | null
          opening_balance?: number
          opening_balance_date?: string | null
          opening_balance_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'export' | 'local'
          billing_currency?: 'GBP' | 'PKR' | 'USD'
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          billing_address?: string | null
          opening_balance?: number
          opening_balance_date?: string | null
          opening_balance_note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          client_name: string
          product: string
          po_number: string | null
          qty: number
          value: number
          order_date: string
          delivery_date: string
          status: string
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          ship_to: string | null
          fabric: string | null
          notes: string | null
          produced: number
          rejected: number
          packed: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          client_id?: string | null
          client_name: string
          product: string
          po_number?: string | null
          qty?: number
          value?: number
          order_date: string
          delivery_date: string
          status?: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          ship_to?: string | null
          fabric?: string | null
          notes?: string | null
          produced?: number
          rejected?: number
          packed?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          client_name?: string
          product?: string
          po_number?: string | null
          qty?: number
          value?: number
          order_date?: string
          delivery_date?: string
          status?: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          ship_to?: string | null
          fabric?: string | null
          notes?: string | null
          produced?: number
          rejected?: number
          packed?: number
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          user_id: string
          material_name: string
          material_type: string
          current_stock: number
          unit: string
          reorder_level: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          material_name: string
          material_type: string
          current_stock?: number
          unit?: string
          reorder_level?: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          material_name?: string
          material_type?: string
          current_stock?: number
          unit?: string
          reorder_level?: number
          last_updated?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      next_order_number: {
        Args: { p_user_id: string }
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
