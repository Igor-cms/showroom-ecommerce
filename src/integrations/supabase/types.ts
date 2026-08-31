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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      annual_revenue_targets: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          target_retail: number | null
          target_revenue: number
          target_wholesale: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          target_retail?: number | null
          target_revenue?: number
          target_wholesale?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          target_retail?: number | null
          target_revenue?: number
          target_wholesale?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      auth_sessions: {
        Row: {
          code_verifier: string
          created_at: string
          email: string | null
          expires_at: string
          nonce: string
          state: string
        }
        Insert: {
          code_verifier: string
          created_at?: string
          email?: string | null
          expires_at?: string
          nonce: string
          state: string
        }
        Update: {
          code_verifier?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          nonce?: string
          state?: string
        }
        Relationships: []
      }
      batch_cost_lines: {
        Row: {
          amount: number
          batch_id: string
          category: Database["public"]["Enums"]["batch_cost_category"]
          created_at: string
          currency: string
          id: string
          memo: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          batch_id: string
          category: Database["public"]["Enums"]["batch_cost_category"]
          created_at?: string
          currency?: string
          id?: string
          memo?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          batch_id?: string
          category?: Database["public"]["Enums"]["batch_cost_category"]
          created_at?: string
          currency?: string
          id?: string
          memo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_cost_lines_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "roasted_coffee_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_positioning: {
        Row: {
          advantage_1: string | null
          advantage_2: string | null
          created_at: string
          id: string
          market_position: string | null
          submission_id: string
          value_proposition: string | null
        }
        Insert: {
          advantage_1?: string | null
          advantage_2?: string | null
          created_at?: string
          id?: string
          market_position?: string | null
          submission_id: string
          value_proposition?: string | null
        }
        Update: {
          advantage_1?: string | null
          advantage_2?: string | null
          created_at?: string
          id?: string
          market_position?: string | null
          submission_id?: string
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_positioning_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      capex_assets: {
        Row: {
          created_at: string
          currency: string
          depreciation_method: Database["public"]["Enums"]["depreciation_method"]
          id: string
          is_active: boolean
          is_estimated: boolean
          memo: string | null
          name: string
          purchase_amount: number
          purchase_date: string
          salvage_value: number
          updated_at: string
          useful_life_months: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          depreciation_method?: Database["public"]["Enums"]["depreciation_method"]
          id?: string
          is_active?: boolean
          is_estimated?: boolean
          memo?: string | null
          name: string
          purchase_amount: number
          purchase_date: string
          salvage_value?: number
          updated_at?: string
          useful_life_months: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          depreciation_method?: Database["public"]["Enums"]["depreciation_method"]
          id?: string
          is_active?: boolean
          is_estimated?: boolean
          memo?: string | null
          name?: string
          purchase_amount?: number
          purchase_date?: string
          salvage_value?: number
          updated_at?: string
          useful_life_months?: number
          user_id?: string
        }
        Relationships: []
      }
      capex_depreciation_entries: {
        Row: {
          amount: number
          asset_id: string
          created_at: string
          currency: string
          generated: boolean
          id: string
          memo: string | null
          month: string
        }
        Insert: {
          amount: number
          asset_id: string
          created_at?: string
          currency?: string
          generated?: boolean
          id?: string
          memo?: string | null
          month: string
        }
        Update: {
          amount?: number
          asset_id?: string
          created_at?: string
          currency?: string
          generated?: boolean
          id?: string
          memo?: string | null
          month?: string
        }
        Relationships: [
          {
            foreignKeyName: "capex_depreciation_entries_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "capex_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      coffee_portfolio: {
        Row: {
          created_at: string
          id: string
          name: string
          origin: string | null
          price: string | null
          process: string | null
          roast_level: string | null
          score: number | null
          sensory_notes: string | null
          submission_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          origin?: string | null
          price?: string | null
          process?: string | null
          roast_level?: string | null
          score?: number | null
          sensory_notes?: string | null
          submission_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          origin?: string | null
          price?: string | null
          process?: string | null
          roast_level?: string | null
          score?: number | null
          sensory_notes?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coffee_portfolio_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      coffee_stands: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          establishment_type: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          name: string
          onboarding_completed_at: string | null
          opening_hours: Json | null
          owner_user_id: string | null
          phone: string | null
          state: string | null
          tour_completed_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          establishment_type?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name: string
          onboarding_completed_at?: string | null
          opening_hours?: Json | null
          owner_user_id?: string | null
          phone?: string | null
          state?: string | null
          tour_completed_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          establishment_type?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          onboarding_completed_at?: string | null
          opening_hours?: Json | null
          owner_user_id?: string | null
          phone?: string | null
          state?: string | null
          tour_completed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coffees: {
        Row: {
          altitude: string | null
          brand: string | null
          created_at: string | null
          created_by_user_id: string | null
          farm_producer: string | null
          id: string
          image_back_url: string | null
          image_url: string | null
          name: string
          ocr_attempts: number | null
          ocr_error_message: string | null
          ocr_last_attempt_at: string | null
          ocr_status: string | null
          origin: string | null
          process: string | null
          region: string | null
          roast_level: string | null
          status: Database["public"]["Enums"]["coffee_status"]
          updated_at: string | null
          variety: string | null
        }
        Insert: {
          altitude?: string | null
          brand?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          farm_producer?: string | null
          id?: string
          image_back_url?: string | null
          image_url?: string | null
          name: string
          ocr_attempts?: number | null
          ocr_error_message?: string | null
          ocr_last_attempt_at?: string | null
          ocr_status?: string | null
          origin?: string | null
          process?: string | null
          region?: string | null
          roast_level?: string | null
          status?: Database["public"]["Enums"]["coffee_status"]
          updated_at?: string | null
          variety?: string | null
        }
        Update: {
          altitude?: string | null
          brand?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          farm_producer?: string | null
          id?: string
          image_back_url?: string | null
          image_url?: string | null
          name?: string
          ocr_attempts?: number | null
          ocr_error_message?: string | null
          ocr_last_attempt_at?: string | null
          ocr_status?: string | null
          origin?: string | null
          process?: string | null
          region?: string | null
          roast_level?: string | null
          status?: Database["public"]["Enums"]["coffee_status"]
          updated_at?: string | null
          variety?: string | null
        }
        Relationships: []
      }
      coffeeshop_products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          origin: string | null
          price: number | null
          roast_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          origin?: string | null
          price?: number | null
          roast_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          origin?: string | null
          price?: number | null
          roast_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_payments: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          status: string | null
          user_id: string
          withdrawal_id: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_amount: number
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
          user_id: string
          withdrawal_id?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
          user_id?: string
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "supply_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_payments_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "contract_withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_withdrawals: {
        Row: {
          added_to_inventory: boolean | null
          contract_id: string
          created_at: string
          id: string
          notes: string | null
          quantity_kg: number
          status: string | null
          stock_log_id: string | null
          total_value: number | null
          unit_price_per_kg: number
          updated_at: string
          user_id: string
          withdrawal_date: string
          withdrawal_number: string | null
        }
        Insert: {
          added_to_inventory?: boolean | null
          contract_id: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity_kg: number
          status?: string | null
          stock_log_id?: string | null
          total_value?: number | null
          unit_price_per_kg: number
          updated_at?: string
          user_id: string
          withdrawal_date: string
          withdrawal_number?: string | null
        }
        Update: {
          added_to_inventory?: boolean | null
          contract_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity_kg?: number
          status?: string | null
          stock_log_id?: string | null
          total_value?: number | null
          unit_price_per_kg?: number
          updated_at?: string
          user_id?: string
          withdrawal_date?: string
          withdrawal_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_withdrawals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "supply_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_withdrawals_stock_log_id_fkey"
            columns: ["stock_log_id"]
            isOneToOne: false
            referencedRelation: "green_coffee_stock_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["category_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["category_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cost_expenses: {
        Row: {
          allocate_to_all_coffees: boolean | null
          amount: number
          attachment_url: string | null
          category_id: string | null
          cost_per_unit: number | null
          created_at: string
          currency: string
          date_incurred: string
          financing_method: string | null
          green_coffee_id: string | null
          id: string
          installment_amount: number | null
          interest_rate: number | null
          is_estimated: boolean
          is_financed: boolean | null
          is_paid: boolean | null
          linked_batch_id: string | null
          memo: string | null
          month: string
          name: string | null
          payment_date: string | null
          payment_end_date: string | null
          payment_schedule_type: string | null
          payment_start_date: string | null
          quantity_allocated: number | null
          quantity_purchased: number | null
          source: Database["public"]["Enums"]["expense_source"]
          subcategory_id: string | null
          total_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allocate_to_all_coffees?: boolean | null
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string
          currency?: string
          date_incurred?: string
          financing_method?: string | null
          green_coffee_id?: string | null
          id?: string
          installment_amount?: number | null
          interest_rate?: number | null
          is_estimated?: boolean
          is_financed?: boolean | null
          is_paid?: boolean | null
          linked_batch_id?: string | null
          memo?: string | null
          month: string
          name?: string | null
          payment_date?: string | null
          payment_end_date?: string | null
          payment_schedule_type?: string | null
          payment_start_date?: string | null
          quantity_allocated?: number | null
          quantity_purchased?: number | null
          source: Database["public"]["Enums"]["expense_source"]
          subcategory_id?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allocate_to_all_coffees?: boolean | null
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string
          currency?: string
          date_incurred?: string
          financing_method?: string | null
          green_coffee_id?: string | null
          id?: string
          installment_amount?: number | null
          interest_rate?: number | null
          is_estimated?: boolean
          is_financed?: boolean | null
          is_paid?: boolean | null
          linked_batch_id?: string | null
          memo?: string | null
          month?: string
          name?: string | null
          payment_date?: string | null
          payment_end_date?: string | null
          payment_schedule_type?: string | null
          payment_start_date?: string | null
          quantity_allocated?: number | null
          quantity_purchased?: number | null
          source?: Database["public"]["Enums"]["expense_source"]
          subcategory_id?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_expenses_green_coffee_id_fkey"
            columns: ["green_coffee_id"]
            isOneToOne: false
            referencedRelation: "green_coffee_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_expenses_linked_batch_id_fkey"
            columns: ["linked_batch_id"]
            isOneToOne: false
            referencedRelation: "roasted_coffee_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_expenses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_records: {
        Row: {
          category: string
          cost_100g: number | null
          cost_1kg: number | null
          cost_2_5kg: number | null
          cost_200g: number | null
          cost_250g: number | null
          created_at: string
          id: string
          name: string
          total_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          cost_100g?: number | null
          cost_1kg?: number | null
          cost_2_5kg?: number | null
          cost_200g?: number | null
          cost_250g?: number | null
          created_at?: string
          id?: string
          name: string
          total_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          cost_100g?: number | null
          cost_1kg?: number | null
          cost_2_5kg?: number | null
          cost_200g?: number | null
          cost_250g?: number | null
          created_at?: string
          id?: string
          name?: string
          total_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coy_nominations: {
        Row: {
          anonymous_code: string | null
          coffee_id: string | null
          coffee_type: string | null
          created_at: string | null
          day: string | null
          id: string
          is_active: boolean | null
          nominated_at: string | null
          results_revealed: boolean | null
          year: number
        }
        Insert: {
          anonymous_code?: string | null
          coffee_id?: string | null
          coffee_type?: string | null
          created_at?: string | null
          day?: string | null
          id?: string
          is_active?: boolean | null
          nominated_at?: string | null
          results_revealed?: boolean | null
          year: number
        }
        Update: {
          anonymous_code?: string | null
          coffee_id?: string | null
          coffee_type?: string | null
          created_at?: string | null
          day?: string | null
          id?: string
          is_active?: boolean | null
          nominated_at?: string | null
          results_revealed?: boolean | null
          year?: number
        }
        Relationships: []
      }
      coy_votes: {
        Row: {
          created_at: string | null
          id: string
          nomination_id: string
          user_id: string
          voted_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          nomination_id: string
          user_id: string
          voted_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          nomination_id?: string
          user_id?: string
          voted_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "coy_votes_nomination_id_fkey"
            columns: ["nomination_id"]
            isOneToOne: false
            referencedRelation: "coy_nominations"
            referencedColumns: ["id"]
          },
        ]
      }
      cupping_evaluations: {
        Row: {
          body_notes: string[] | null
          created_at: string
          id: string
          notes: string | null
          producer_id: string
          rating: number
          round_id: string
          sensory_notes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_notes?: string[] | null
          created_at?: string
          id?: string
          notes?: string | null
          producer_id: string
          rating: number
          round_id: string
          sensory_notes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_notes?: string[] | null
          created_at?: string
          id?: string
          notes?: string | null
          producer_id?: string
          rating?: number
          round_id?: string
          sensory_notes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cupping_evaluations_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "cupping_producers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupping_evaluations_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "cupping_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      cupping_producers: {
        Row: {
          city: string | null
          created_at: string
          id: string
          processing_method: string | null
          producer_name: string
          property_name: string | null
          region: string | null
          round_id: string
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          processing_method?: string | null
          producer_name: string
          property_name?: string | null
          region?: string | null
          round_id: string
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          processing_method?: string | null
          producer_name?: string
          property_name?: string | null
          region?: string | null
          round_id?: string
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cupping_producers_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "cupping_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      cupping_rounds: {
        Row: {
          coffee_type: string
          created_at: string
          date: string
          display_name: string
          end_time: string
          id: string
          room: string
          round_code: string
          start_time: string
        }
        Insert: {
          coffee_type: string
          created_at?: string
          date: string
          display_name: string
          end_time: string
          id?: string
          room: string
          round_code: string
          start_time: string
        }
        Update: {
          coffee_type?: string
          created_at?: string
          date?: string
          display_name?: string
          end_time?: string
          id?: string
          room?: string
          round_code?: string
          start_time?: string
        }
        Relationships: []
      }
      cupping_sensory_notes: {
        Row: {
          created_at: string
          id: string
          note: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
        }
        Relationships: []
      }
      customer_sessions: {
        Row: {
          access_token: string
          created_at: string
          customer_id: string | null
          email: string | null
          expires_at: string
          id_token: string | null
          refresh_token: string | null
          session_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          expires_at: string
          id_token?: string | null
          refresh_token?: string | null
          session_id?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          expires_at?: string
          id_token?: string | null
          refresh_token?: string | null
          session_id?: string
        }
        Relationships: []
      }
      direct_competitors: {
        Row: {
          created_at: string
          id: string
          market_share: string | null
          name: string
          strength: string | null
          submission_id: string
          weakness: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          market_share?: string | null
          name: string
          strength?: string | null
          submission_id: string
          weakness?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          market_share?: string | null
          name?: string
          strength?: string | null
          submission_id?: string
          weakness?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_competitors_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_cafes: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          place_id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          place_id: string
          rating?: number | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          place_id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      favorite_roasters: {
        Row: {
          created_at: string
          id: string
          roaster_user_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          roaster_user_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          roaster_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_roasters_roaster_user_id_fkey"
            columns: ["roaster_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          analysis_data: Json | null
          analysis_status: string | null
          created_at: string
          email: string
          id: string
          shop_url: string
          submitted_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          analysis_status?: string | null
          created_at?: string
          email: string
          id?: string
          shop_url: string
          submitted_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          analysis_status?: string | null
          created_at?: string
          email?: string
          id?: string
          shop_url?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      green_coffee_inventory: {
        Row: {
          altitude: string | null
          cost_per_unit: number
          created_at: string
          current_stock: number
          farm: string | null
          harvest_date: string | null
          id: string
          is_on_order: boolean | null
          lead_time_days: number
          maximum_stock: number
          minimum_stock: number
          name: string
          notes: string | null
          order_date: string | null
          origin: string
          processing_method: string | null
          quality_score: number | null
          supplier: string | null
          unit: string
          updated_at: string
          user_id: string
          variety: string | null
          warehouse: string | null
        }
        Insert: {
          altitude?: string | null
          cost_per_unit: number
          created_at?: string
          current_stock?: number
          farm?: string | null
          harvest_date?: string | null
          id?: string
          is_on_order?: boolean | null
          lead_time_days?: number
          maximum_stock?: number
          minimum_stock?: number
          name: string
          notes?: string | null
          order_date?: string | null
          origin: string
          processing_method?: string | null
          quality_score?: number | null
          supplier?: string | null
          unit?: string
          updated_at?: string
          user_id: string
          variety?: string | null
          warehouse?: string | null
        }
        Update: {
          altitude?: string | null
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          farm?: string | null
          harvest_date?: string | null
          id?: string
          is_on_order?: boolean | null
          lead_time_days?: number
          maximum_stock?: number
          minimum_stock?: number
          name?: string
          notes?: string | null
          order_date?: string | null
          origin?: string
          processing_method?: string | null
          quality_score?: number | null
          supplier?: string | null
          unit?: string
          updated_at?: string
          user_id?: string
          variety?: string | null
          warehouse?: string | null
        }
        Relationships: []
      }
      green_coffee_payments: {
        Row: {
          created_at: string
          green_coffee_id: string
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          green_coffee_id: string
          id?: string
          notes?: string | null
          payment_amount: number
          payment_date?: string
          payment_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          green_coffee_id?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "green_coffee_payments_green_coffee_id_fkey"
            columns: ["green_coffee_id"]
            isOneToOne: false
            referencedRelation: "green_coffee_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      green_coffee_stock_logs: {
        Row: {
          cost_per_kg: number
          created_at: string
          entry_date: string
          green_coffee_id: string
          id: string
          payment_date: string | null
          quantity: number
          total_cost: number
          user_id: string
        }
        Insert: {
          cost_per_kg: number
          created_at?: string
          entry_date: string
          green_coffee_id: string
          id?: string
          payment_date?: string | null
          quantity: number
          total_cost: number
          user_id: string
        }
        Update: {
          cost_per_kg?: number
          created_at?: string
          entry_date?: string
          green_coffee_id?: string
          id?: string
          payment_date?: string | null
          quantity?: number
          total_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_green_coffee"
            columns: ["green_coffee_id"]
            isOneToOne: false
            referencedRelation: "green_coffee_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_cards: {
        Row: {
          coffee_shop_id: string
          created_at: string
          id: string
          is_active: boolean
          qr_code_token: string | null
          reward_description: string
          reward_image_url: string | null
          stamps_required: number
          updated_at: string
        }
        Insert: {
          coffee_shop_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          qr_code_token?: string | null
          reward_description?: string
          reward_image_url?: string | null
          stamps_required?: number
          updated_at?: string
        }
        Update: {
          coffee_shop_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          qr_code_token?: string | null
          reward_description?: string
          reward_image_url?: string | null
          stamps_required?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_cards_coffee_shop_id_fkey"
            columns: ["coffee_shop_id"]
            isOneToOne: true
            referencedRelation: "coffee_stands"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_redemptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          redeemed_at: string
          redemption_token: string | null
          reward_description: string
          status: string
          user_loyalty_card_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          redeemed_at?: string
          redemption_token?: string | null
          reward_description: string
          status?: string
          user_loyalty_card_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          redeemed_at?: string
          redemption_token?: string | null
          reward_description?: string
          status?: string
          user_loyalty_card_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_redemptions_user_loyalty_card_id_fkey"
            columns: ["user_loyalty_card_id"]
            isOneToOne: false
            referencedRelation: "user_loyalty_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_stamps: {
        Row: {
          created_at: string
          id: string
          qr_code_token: string | null
          scanned_at: string
          user_loyalty_card_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          qr_code_token?: string | null
          scanned_at?: string
          user_loyalty_card_id: string
        }
        Update: {
          created_at?: string
          id?: string
          qr_code_token?: string | null
          scanned_at?: string
          user_loyalty_card_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_stamps_user_loyalty_card_id_fkey"
            columns: ["user_loyalty_card_id"]
            isOneToOne: false
            referencedRelation: "user_loyalty_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_revenue_targets: {
        Row: {
          created_at: string | null
          id: string
          month: string
          notes: string | null
          target_retail: number | null
          target_revenue: number
          target_wholesale: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: string
          notes?: string | null
          target_retail?: number | null
          target_revenue?: number
          target_wholesale?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          notes?: string | null
          target_retail?: number | null
          target_revenue?: number
          target_wholesale?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      monthly_roast_targets: {
        Row: {
          created_at: string
          id: string
          month: string
          target_volume_kg: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          target_volume_kg?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          target_volume_kg?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          expected_delivery_date: string | null
          id: string
          item_id: string
          item_type: string
          notes: string | null
          order_date: string
          quantity: number
          status: string
          supplier: string
          total_cost: number
          unit_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          expected_delivery_date?: string | null
          id?: string
          item_id: string
          item_type: string
          notes?: string | null
          order_date?: string
          quantity: number
          status?: string
          supplier: string
          total_cost: number
          unit_cost: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          expected_delivery_date?: string | null
          id?: string
          item_id?: string
          item_type?: string
          notes?: string | null
          order_date?: string
          quantity?: number
          status?: string
          supplier?: string
          total_cost?: number
          unit_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      packaging_inventory: {
        Row: {
          cost_per_unit: number
          created_at: string
          current_stock: number
          id: string
          is_on_order: boolean | null
          lead_time_days: number
          maximum_stock: number
          minimum_stock: number
          name: string
          order_date: string | null
          size: string
          supplier: string | null
          type: string
          updated_at: string
          user_id: string
          warehouse: string | null
        }
        Insert: {
          cost_per_unit: number
          created_at?: string
          current_stock?: number
          id?: string
          is_on_order?: boolean | null
          lead_time_days?: number
          maximum_stock?: number
          minimum_stock?: number
          name: string
          order_date?: string | null
          size: string
          supplier?: string | null
          type: string
          updated_at?: string
          user_id: string
          warehouse?: string | null
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          id?: string
          is_on_order?: boolean | null
          lead_time_days?: number
          maximum_stock?: number
          minimum_stock?: number
          name?: string
          order_date?: string | null
          size?: string
          supplier?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          warehouse?: string | null
        }
        Relationships: []
      }
      packaging_items: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          name: string
          reorder_point: number
          sku: string | null
          supplier: string | null
          type: string
          unit: string
          unit_cost: number
          updated_at: string
          user_id: string
          warehouse: string | null
        }
        Insert: {
          created_at?: string
          current_stock?: number
          id?: string
          name: string
          reorder_point?: number
          sku?: string | null
          supplier?: string | null
          type?: string
          unit?: string
          unit_cost: number
          updated_at?: string
          user_id: string
          warehouse?: string | null
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          name?: string
          reorder_point?: number
          sku?: string | null
          supplier?: string | null
          type?: string
          unit?: string
          unit_cost?: number
          updated_at?: string
          user_id?: string
          warehouse?: string | null
        }
        Relationships: []
      }
      packaging_movements: {
        Row: {
          created_at: string
          id: string
          item_id: string
          linked_batch_id: string | null
          memo: string | null
          movement_date: string
          qty_delta: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          linked_batch_id?: string | null
          memo?: string | null
          movement_date?: string
          qty_delta: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          linked_batch_id?: string | null
          memo?: string | null
          movement_date?: string
          qty_delta?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_movements_linked_batch_id_fkey"
            columns: ["linked_batch_id"]
            isOneToOne: false
            referencedRelation: "roasted_coffee_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging_stock_logs: {
        Row: {
          cost_per_unit: number
          created_at: string | null
          entry_date: string
          id: string
          packaging_id: string
          payment_date: string | null
          quantity: number
          total_cost: number
          user_id: string
        }
        Insert: {
          cost_per_unit: number
          created_at?: string | null
          entry_date: string
          id?: string
          packaging_id: string
          payment_date?: string | null
          quantity: number
          total_cost: number
          user_id: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string | null
          entry_date?: string
          id?: string
          packaging_id?: string
          payment_date?: string | null
          quantity?: number
          total_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_stock_logs_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "packaging_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging_template_extra_costs: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          packaging_item_id: string
          quantity: number
          template_id: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          packaging_item_id: string
          quantity?: number
          template_id: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          packaging_item_id?: string
          quantity?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_template_extra_costs_packaging_item_id_fkey"
            columns: ["packaging_item_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_template_extra_costs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "packaging_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging_templates: {
        Row: {
          created_at: string
          id: string
          label_id: string | null
          name: string
          packaging_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label_id?: string | null
          name: string
          packaging_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label_id?: string | null
          name?: string
          packaging_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_templates_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_templates_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
        ]
      }
      page_permissions: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          page_key: string
          page_title: string
          page_url: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          page_key: string
          page_title: string
          page_url: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          page_key?: string
          page_title?: string
          page_url?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      potential_clients: {
        Row: {
          client_type: string | null
          created_at: string
          followers: string | null
          id: string
          location: string | null
          match_score: number | null
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          submission_id: string
        }
        Insert: {
          client_type?: string | null
          created_at?: string
          followers?: string | null
          id?: string
          location?: string | null
          match_score?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          submission_id: string
        }
        Update: {
          client_type?: string | null
          created_at?: string
          followers?: string | null
          id?: string
          location?: string | null
          match_score?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "potential_clients_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_views: {
        Row: {
          created_at: string
          description: string | null
          id: string
          markup_percentage: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          markup_percentage?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          markup_percentage?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_extra_costs: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          packaging_item_id: string
          quantity: number
          shopify_product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          packaging_item_id: string
          quantity?: number
          shopify_product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          packaging_item_id?: string
          quantity?: number
          shopify_product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_extra_costs_packaging_item_id_fkey"
            columns: ["packaging_item_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recipe_mappings: {
        Row: {
          confidence_score: number | null
          confirmed_at: string | null
          created_at: string | null
          id: string
          is_auto_matched: boolean | null
          is_confirmed: boolean | null
          is_rejected: boolean | null
          match_category: string | null
          matched_at: string | null
          name_match_score: number | null
          recipe_id: string
          shopify_product_id: string
          shopify_variant_id: string
          size_match_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          is_auto_matched?: boolean | null
          is_confirmed?: boolean | null
          is_rejected?: boolean | null
          match_category?: string | null
          matched_at?: string | null
          name_match_score?: number | null
          recipe_id: string
          shopify_product_id: string
          shopify_variant_id: string
          size_match_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          is_auto_matched?: boolean | null
          is_confirmed?: boolean | null
          is_rejected?: boolean | null
          match_category?: string | null
          matched_at?: string | null
          name_match_score?: number | null
          recipe_id?: string
          shopify_product_id?: string
          shopify_variant_id?: string
          size_match_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recipe_mappings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipe_mappings_shopify_product_id_fkey"
            columns: ["shopify_product_id"]
            isOneToOne: false
            referencedRelation: "shopify_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipe_mappings_shopify_variant_id_fkey"
            columns: ["shopify_variant_id"]
            isOneToOne: false
            referencedRelation: "shopify_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sales_forecasts: {
        Row: {
          created_at: string
          forecast_month: string
          forecast_quantity: number
          id: string
          is_user_entered: boolean
          notes: string | null
          shopify_product_id: string
          shopify_variant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          forecast_month: string
          forecast_quantity?: number
          id?: string
          is_user_entered?: boolean
          notes?: string | null
          shopify_product_id: string
          shopify_variant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          forecast_month?: string
          forecast_quantity?: number
          id?: string
          is_user_entered?: boolean
          notes?: string | null
          shopify_product_id?: string
          shopify_variant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_forecasts_shopify_product_id_fkey"
            columns: ["shopify_product_id"]
            isOneToOne: false
            referencedRelation: "shopify_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_forecasts_shopify_variant_id_fkey"
            columns: ["shopify_variant_id"]
            isOneToOne: false
            referencedRelation: "shopify_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_year: number | null
          coffee_relationship: string | null
          company_name: string | null
          cover_image_url: string | null
          created_at: string
          default_quacker_loss: number | null
          default_roast_loss: number | null
          detected_ecommerce_platform: string | null
          email: string
          favorite_drink: string | null
          full_name: string | null
          gender: string | null
          id: string
          logo_url: string | null
          platform_detection_date: string | null
          preferred_currency: string | null
          products_scraped_at: string | null
          store_website: string | null
          updated_at: string
          user_id: string
          user_type: string
          website: string | null
        }
        Insert: {
          birth_year?: number | null
          coffee_relationship?: string | null
          company_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          default_quacker_loss?: number | null
          default_roast_loss?: number | null
          detected_ecommerce_platform?: string | null
          email: string
          favorite_drink?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          logo_url?: string | null
          platform_detection_date?: string | null
          preferred_currency?: string | null
          products_scraped_at?: string | null
          store_website?: string | null
          updated_at?: string
          user_id: string
          user_type: string
          website?: string | null
        }
        Update: {
          birth_year?: number | null
          coffee_relationship?: string | null
          company_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          default_quacker_loss?: number | null
          default_roast_loss?: number | null
          detected_ecommerce_platform?: string | null
          email?: string
          favorite_drink?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          logo_url?: string | null
          platform_detection_date?: string | null
          preferred_currency?: string | null
          products_scraped_at?: string | null
          store_website?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          website?: string | null
        }
        Relationships: []
      }
      recipe_extra_costs: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          packaging_item_id: string
          quantity: number
          recipe_id: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          packaging_item_id: string
          quantity?: number
          recipe_id: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          packaging_item_id?: string
          quantity?: number
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_extra_costs_packaging_item_id_fkey"
            columns: ["packaging_item_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_extra_costs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_materials: {
        Row: {
          cost_per_unit: number
          created_at: string
          green_coffee_id: string | null
          id: string
          material_name: string
          material_type: string
          quantity: number
          recipe_id: string
          total_cost: number
          unit: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          green_coffee_id?: string | null
          id?: string
          material_name: string
          material_type: string
          quantity?: number
          recipe_id: string
          total_cost?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          green_coffee_id?: string | null
          id?: string
          material_name?: string
          material_type?: string
          quantity?: number
          recipe_id?: string
          total_cost?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_materials_green_coffee_id_fkey"
            columns: ["green_coffee_id"]
            isOneToOne: false
            referencedRelation: "green_coffee_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_pricing_view_prices: {
        Row: {
          created_at: string
          id: string
          markup_percentage: number | null
          package_size: string
          pricing_view_id: string
          recipe_id: string
          selling_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          markup_percentage?: number | null
          package_size: string
          pricing_view_id: string
          recipe_id: string
          selling_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          markup_percentage?: number | null
          package_size?: string
          pricing_view_id?: string
          recipe_id?: string
          selling_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          cost_per_kg: number | null
          created_at: string
          expected_loss_percentage: number
          expected_yield: number
          green_coffee_amount: number
          id: string
          is_auto_generated: boolean | null
          label_cost: number | null
          label_id: string | null
          name: string
          notes: string | null
          package_size: string
          packaging_id: string | null
          quacker_loss_percentage: number | null
          recipe_status: string | null
          roast_profile: string | null
          roast_temperature: number | null
          roast_time_minutes: number | null
          roasted_coffee_id: string | null
          selling_price: number | null
          shopify_product_id: string | null
          shopify_variant_id: string | null
          unit_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_kg?: number | null
          created_at?: string
          expected_loss_percentage?: number
          expected_yield: number
          green_coffee_amount: number
          id?: string
          is_auto_generated?: boolean | null
          label_cost?: number | null
          label_id?: string | null
          name: string
          notes?: string | null
          package_size?: string
          packaging_id?: string | null
          quacker_loss_percentage?: number | null
          recipe_status?: string | null
          roast_profile?: string | null
          roast_temperature?: number | null
          roast_time_minutes?: number | null
          roasted_coffee_id?: string | null
          selling_price?: number | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          unit_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_kg?: number | null
          created_at?: string
          expected_loss_percentage?: number
          expected_yield?: number
          green_coffee_amount?: number
          id?: string
          is_auto_generated?: boolean | null
          label_cost?: number | null
          label_id?: string | null
          name?: string
          notes?: string | null
          package_size?: string
          packaging_id?: string | null
          quacker_loss_percentage?: number | null
          recipe_status?: string | null
          roast_profile?: string | null
          roast_temperature?: number | null
          roast_time_minutes?: number | null
          roasted_coffee_id?: string | null
          selling_price?: number | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          unit_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "packaging_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_roasted_coffee_id_fkey"
            columns: ["roasted_coffee_id"]
            isOneToOne: false
            referencedRelation: "roasted_coffee_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_shopify_product_id_fkey"
            columns: ["shopify_product_id"]
            isOneToOne: false
            referencedRelation: "shopify_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_shopify_variant_id_fkey"
            columns: ["shopify_variant_id"]
            isOneToOne: false
            referencedRelation: "shopify_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      roast_records: {
        Row: {
          actual_loss_percentage: number | null
          created_at: string
          green_coffee_input: number
          id: string
          notes: string | null
          quality_score: number | null
          recipe_id: string | null
          roast_date: string
          roast_temperature: number | null
          roast_time_minutes: number | null
          roasted_coffee_output: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_loss_percentage?: number | null
          created_at?: string
          green_coffee_input: number
          id?: string
          notes?: string | null
          quality_score?: number | null
          recipe_id?: string | null
          roast_date?: string
          roast_temperature?: number | null
          roast_time_minutes?: number | null
          roasted_coffee_output: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_loss_percentage?: number | null
          created_at?: string
          green_coffee_input?: number
          id?: string
          notes?: string | null
          quality_score?: number | null
          recipe_id?: string | null
          roast_date?: string
          roast_temperature?: number | null
          roast_time_minutes?: number | null
          roasted_coffee_output?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roast_records_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      roasted_coffee_batches: {
        Row: {
          created_at: string
          green_weight_kg: number
          id: string
          notes: string | null
          product_name: string
          quacker_loss_kg: number | null
          roast_date: string
          roast_weight_kg: number
          roasting_loss_kg: number | null
          sku: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          green_weight_kg: number
          id?: string
          notes?: string | null
          product_name: string
          quacker_loss_kg?: number | null
          roast_date?: string
          roast_weight_kg: number
          roasting_loss_kg?: number | null
          sku?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          green_weight_kg?: number
          id?: string
          notes?: string | null
          product_name?: string
          quacker_loss_kg?: number | null
          roast_date?: string
          roast_weight_kg?: number
          roasting_loss_kg?: number | null
          sku?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roasted_coffee_inventory: {
        Row: {
          cost_per_unit: number
          created_at: string
          current_stock: number
          green_coffee_ids: string[] | null
          id: string
          is_on_order: boolean | null
          maximum_stock: number
          minimum_stock: number
          name: string
          order_date: string | null
          quality_score: number | null
          recipe_id: string | null
          roast_date: string | null
          roast_level: string
          selling_price: number
          shelf_life_days: number
          tasting_notes: string | null
          unit: string
          updated_at: string
          user_id: string
          warehouse: string | null
        }
        Insert: {
          cost_per_unit: number
          created_at?: string
          current_stock?: number
          green_coffee_ids?: string[] | null
          id?: string
          is_on_order?: boolean | null
          maximum_stock?: number
          minimum_stock?: number
          name: string
          order_date?: string | null
          quality_score?: number | null
          recipe_id?: string | null
          roast_date?: string | null
          roast_level: string
          selling_price: number
          shelf_life_days?: number
          tasting_notes?: string | null
          unit?: string
          updated_at?: string
          user_id: string
          warehouse?: string | null
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          green_coffee_ids?: string[] | null
          id?: string
          is_on_order?: boolean | null
          maximum_stock?: number
          minimum_stock?: number
          name?: string
          order_date?: string | null
          quality_score?: number | null
          recipe_id?: string | null
          roast_date?: string | null
          roast_level?: string
          selling_price?: number
          shelf_life_days?: number
          tasting_notes?: string | null
          unit?: string
          updated_at?: string
          user_id?: string
          warehouse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roasted_coffee_inventory_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_type: string | null
          id: string
          product_id: string | null
          quantity: number
          sale_date: string
          total_amount: number
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_type?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          sale_date?: string
          total_amount: number
          unit_price: number
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_type?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sale_date?: string
          total_amount?: number
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "roasted_coffee_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          meta: Json | null
          phone: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          meta?: Json | null
          phone: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          meta?: Json | null
          phone?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shopify_connections: {
        Row: {
          access_token: string | null
          client_id: string | null
          created_at: string
          id: string
          is_active: boolean
          last_product_sync_at: string | null
          last_sync_at: string | null
          last_webhook_at: string | null
          refresh_token: string | null
          scopes: string[] | null
          shop_url: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
          webhook_secret: string | null
          webhooks_registered_at: string | null
        }
        Insert: {
          access_token?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_product_sync_at?: string | null
          last_sync_at?: string | null
          last_webhook_at?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          shop_url: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
          webhooks_registered_at?: string | null
        }
        Update: {
          access_token?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_product_sync_at?: string | null
          last_sync_at?: string | null
          last_webhook_at?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          shop_url?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
          webhooks_registered_at?: string | null
        }
        Relationships: []
      }
      shopify_customer_orders: {
        Row: {
          billing_address: Json | null
          created_at: string
          currency_code: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          fulfillment_status: string | null
          id: string
          note: string | null
          order_date: string
          order_number: string
          order_status: string
          payment_status: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          shopify_order_id: string | null
          subtotal_price: number
          tags: string[] | null
          tax_amount: number | null
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          currency_code?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          fulfillment_status?: string | null
          id?: string
          note?: string | null
          order_date?: string
          order_number: string
          order_status?: string
          payment_status?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          shopify_order_id?: string | null
          subtotal_price?: number
          tags?: string[] | null
          tax_amount?: number | null
          total_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          currency_code?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          fulfillment_status?: string | null
          id?: string
          note?: string | null
          order_date?: string
          order_number?: string
          order_status?: string
          payment_status?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          shopify_order_id?: string | null
          subtotal_price?: number
          tags?: string[] | null
          tax_amount?: number | null
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_customer_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "shopify_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_customers: {
        Row: {
          created_at: string | null
          customer_type: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          orders_count: number | null
          phone: string | null
          shopify_created_at: string | null
          shopify_customer_id: string
          shopify_updated_at: string | null
          tags: string[] | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_type?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          orders_count?: number | null
          phone?: string | null
          shopify_created_at?: string | null
          shopify_customer_id: string
          shopify_updated_at?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_type?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          orders_count?: number | null
          phone?: string | null
          shopify_created_at?: string | null
          shopify_customer_id?: string
          shopify_updated_at?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shopify_order_line_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_title: string
          product_type: string | null
          quantity: number
          shopify_line_item_id: string | null
          sku: string | null
          total_price: number
          variant_id: string | null
          variant_title: string | null
          vendor: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price?: number
          product_id?: string | null
          product_title: string
          product_type?: string | null
          quantity?: number
          shopify_line_item_id?: string | null
          sku?: string | null
          total_price?: number
          variant_id?: string | null
          variant_title?: string | null
          vendor?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_title?: string
          product_type?: string | null
          quantity?: number
          shopify_line_item_id?: string | null
          sku?: string | null
          total_price?: number
          variant_id?: string | null
          variant_title?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_line_items_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopify_customer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_order_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shopify_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_order_line_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "shopify_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string
          id: string
          inventory_quantity: number | null
          option1: string | null
          option2: string | null
          option3: string | null
          price: number | null
          product_id: string
          shopify_variant_id: string
          sku: string | null
          title: string
          updated_at: string
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          inventory_quantity?: number | null
          option1?: string | null
          option2?: string | null
          option3?: string | null
          price?: number | null
          product_id: string
          shopify_variant_id: string
          sku?: string | null
          title: string
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          inventory_quantity?: number | null
          option1?: string | null
          option2?: string | null
          option3?: string | null
          price?: number | null
          product_id?: string
          shopify_variant_id?: string
          sku?: string | null
          title?: string
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shopify_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_products: {
        Row: {
          created_at: string
          data_source: string | null
          description: string | null
          id: string
          image_url: string | null
          is_public_for_consumers: boolean | null
          product_type: string | null
          shopify_created_at: string | null
          shopify_product_id: string
          shopify_updated_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          created_at?: string
          data_source?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_public_for_consumers?: boolean | null
          product_type?: string | null
          shopify_created_at?: string | null
          shopify_product_id: string
          shopify_updated_at?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          created_at?: string
          data_source?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_public_for_consumers?: boolean | null
          product_type?: string | null
          shopify_created_at?: string | null
          shopify_product_id?: string
          shopify_updated_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: []
      }
      square_catalog_items: {
        Row: {
          category_id: string | null
          category_name: string | null
          created_at: string
          description: string | null
          id: string
          is_available: boolean | null
          name: string
          square_id: string
          updated_at: string
          user_id: string
          variations: Json | null
        }
        Insert: {
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          square_id: string
          updated_at?: string
          user_id: string
          variations?: Json | null
        }
        Update: {
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          square_id?: string
          updated_at?: string
          user_id?: string
          variations?: Json | null
        }
        Relationships: []
      }
      square_connections: {
        Row: {
          access_token: string
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          location_id: string | null
          location_name: string | null
          merchant_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          location_id?: string | null
          location_name?: string | null
          merchant_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          location_id?: string | null
          location_name?: string | null
          merchant_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      square_customers: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          family_name: string | null
          given_name: string | null
          id: string
          note: string | null
          phone: string | null
          square_customer_id: string
          total_spent: number | null
          updated_at: string
          user_id: string
          visit_count: number | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          family_name?: string | null
          given_name?: string | null
          id?: string
          note?: string | null
          phone?: string | null
          square_customer_id: string
          total_spent?: number | null
          updated_at?: string
          user_id: string
          visit_count?: number | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          family_name?: string | null
          given_name?: string | null
          id?: string
          note?: string | null
          phone?: string | null
          square_customer_id?: string
          total_spent?: number | null
          updated_at?: string
          user_id?: string
          visit_count?: number | null
        }
        Relationships: []
      }
      square_transaction_items: {
        Row: {
          base_price_money: number | null
          catalog_object_id: string | null
          created_at: string
          id: string
          name: string
          note: string | null
          quantity: number
          square_item_id: string | null
          total_money: number | null
          transaction_id: string
          variation_name: string | null
        }
        Insert: {
          base_price_money?: number | null
          catalog_object_id?: string | null
          created_at?: string
          id?: string
          name: string
          note?: string | null
          quantity?: number
          square_item_id?: string | null
          total_money?: number | null
          transaction_id: string
          variation_name?: string | null
        }
        Update: {
          base_price_money?: number | null
          catalog_object_id?: string | null
          created_at?: string
          id?: string
          name?: string
          note?: string | null
          quantity?: number
          square_item_id?: string | null
          total_money?: number | null
          transaction_id?: string
          variation_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "square_transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "square_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      square_transactions: {
        Row: {
          closed_at: string | null
          created_at: string
          currency: string | null
          id: string
          location_id: string | null
          source_type: string | null
          square_customer_id: string | null
          square_order_id: string
          state: string | null
          total_discount_money: number | null
          total_money: number
          total_tax_money: number | null
          total_tip_money: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          location_id?: string | null
          source_type?: string | null
          square_customer_id?: string | null
          square_order_id: string
          state?: string | null
          total_discount_money?: number | null
          total_money?: number
          total_tax_money?: number | null
          total_tip_money?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          location_id?: string | null
          source_type?: string | null
          square_customer_id?: string | null
          square_order_id?: string
          state?: string | null
          total_discount_money?: number | null
          total_money?: number
          total_tax_money?: number | null
          total_tip_money?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stand_claims: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          stand_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stand_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stand_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stand_claims_stand_id_fkey"
            columns: ["stand_id"]
            isOneToOne: false
            referencedRelation: "coffee_stands"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_notify_signups: {
        Row: {
          consent_at: string
          consent_ip: string | null
          consent_text_version: string | null
          consent_user_agent: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          mailchimp_error: string | null
          mailchimp_status: string
          mailchimp_synced_at: string | null
          mailchimp_tag: string | null
          notified_at: string | null
          product_handle: string
          product_title: string | null
          shopify_customer_id: string | null
          shopify_product_id: string | null
          source: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          consent_at?: string
          consent_ip?: string | null
          consent_text_version?: string | null
          consent_user_agent?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mailchimp_error?: string | null
          mailchimp_status?: string
          mailchimp_synced_at?: string | null
          mailchimp_tag?: string | null
          notified_at?: string | null
          product_handle: string
          product_title?: string | null
          shopify_customer_id?: string | null
          shopify_product_id?: string | null
          source: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          consent_at?: string
          consent_ip?: string | null
          consent_text_version?: string | null
          consent_user_agent?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mailchimp_error?: string | null
          mailchimp_status?: string
          mailchimp_synced_at?: string | null
          mailchimp_tag?: string | null
          notified_at?: string | null
          product_handle?: string
          product_title?: string | null
          shopify_customer_id?: string | null
          shopify_product_id?: string | null
          source?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          supplier_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          supplier_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          supplier_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supply_contracts: {
        Row: {
          coffee_name: string
          contract_date: string
          contract_number: string | null
          created_at: string
          currency: string
          end_date: string
          green_coffee_id: string | null
          id: string
          notes: string | null
          paid_amount: number | null
          payment_terms: string | null
          pending_amount: number | null
          remaining_quantity_kg: number | null
          start_date: string
          status: string | null
          supplier_id: string | null
          supplier_name: string
          total_contract_value: number | null
          total_quantity_kg: number
          unit_price_per_kg: number
          updated_at: string
          user_id: string
          withdrawn_quantity_kg: number | null
        }
        Insert: {
          coffee_name: string
          contract_date: string
          contract_number?: string | null
          created_at?: string
          currency?: string
          end_date: string
          green_coffee_id?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_terms?: string | null
          pending_amount?: number | null
          remaining_quantity_kg?: number | null
          start_date: string
          status?: string | null
          supplier_id?: string | null
          supplier_name: string
          total_contract_value?: number | null
          total_quantity_kg: number
          unit_price_per_kg: number
          updated_at?: string
          user_id: string
          withdrawn_quantity_kg?: number | null
        }
        Update: {
          coffee_name?: string
          contract_date?: string
          contract_number?: string | null
          created_at?: string
          currency?: string
          end_date?: string
          green_coffee_id?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_terms?: string | null
          pending_amount?: number | null
          remaining_quantity_kg?: number | null
          start_date?: string
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string
          total_contract_value?: number | null
          total_quantity_kg?: number
          unit_price_per_kg?: number
          updated_at?: string
          user_id?: string
          withdrawn_quantity_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_contracts_green_coffee_id_fkey"
            columns: ["green_coffee_id"]
            isOneToOne: false
            referencedRelation: "green_coffee_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      target_personas: {
        Row: {
          avg_volume: string | null
          characteristics: string[] | null
          created_at: string
          description: string | null
          id: string
          location_type: string | null
          pain_points: string[] | null
          persona_type: string
          submission_id: string
        }
        Insert: {
          avg_volume?: string | null
          characteristics?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          location_type?: string | null
          pain_points?: string[] | null
          persona_type: string
          submission_id: string
        }
        Update: {
          avg_volume?: string | null
          characteristics?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          location_type?: string | null
          pain_points?: string[] | null
          persona_type?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_personas_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coffee_evaluations: {
        Row: {
          body_notes: string[] | null
          brewing_method: string | null
          coffee_id: string | null
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          rating: number | null
          sensory_notes: string[] | null
          shopify_product_id: string | null
          stand_brand: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body_notes?: string[] | null
          brewing_method?: string | null
          coffee_id?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          rating?: number | null
          sensory_notes?: string[] | null
          shopify_product_id?: string | null
          stand_brand?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body_notes?: string[] | null
          brewing_method?: string | null
          coffee_id?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          rating?: number | null
          sensory_notes?: string[] | null
          shopify_product_id?: string | null
          stand_brand?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coffee_evaluations_coffee_id_fkey"
            columns: ["coffee_id"]
            isOneToOne: false
            referencedRelation: "coffees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coffee_evaluations_shopify_product_id_fkey"
            columns: ["shopify_product_id"]
            isOneToOne: false
            referencedRelation: "shopify_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_loyalty_cards: {
        Row: {
          created_at: string
          id: string
          loyalty_card_id: string
          rewards_redeemed: number
          stamps_collected: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          loyalty_card_id: string
          rewards_redeemed?: number
          stamps_collected?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          loyalty_card_id?: string
          rewards_redeemed?: number
          stamps_collected?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_loyalty_cards_loyalty_card_id_fkey"
            columns: ["loyalty_card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_applications: {
        Row: {
          cell: string
          created_at: string
          email: string
          id: string
          instagram: string | null
          lot_size: string
          name: string
          notes: string | null
          price_range_max: number
          price_range_min: number
          sensory_profile: string[]
          shop: string
          status: string
        }
        Insert: {
          cell: string
          created_at?: string
          email: string
          id?: string
          instagram?: string | null
          lot_size: string
          name: string
          notes?: string | null
          price_range_max: number
          price_range_min: number
          sensory_profile?: string[]
          shop: string
          status?: string
        }
        Update: {
          cell?: string
          created_at?: string
          email?: string
          id?: string
          instagram?: string | null
          lot_size?: string
          name?: string
          notes?: string | null
          price_range_max?: number
          price_range_min?: number
          sensory_profile?: string[]
          shop?: string
          status?: string
        }
        Relationships: []
      }
      whatsapp_tokens: {
        Row: {
          created_at: string
          expires_at: string
          phone: string
          token: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          phone: string
          token: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          phone?: string
          token?: string
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: []
      }
      wholesale_requests: {
        Row: {
          business_tax_number: string | null
          city: string
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string | null
          mode: string
          other_business_number: string | null
          phone: string | null
          shipping_address: string
          shop_name: string
          shopify_customer_id: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          business_tax_number?: string | null
          city: string
          country: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message?: string | null
          mode?: string
          other_business_number?: string | null
          phone?: string | null
          shipping_address: string
          shop_name: string
          shopify_customer_id?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          business_tax_number?: string | null
          city?: string
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string | null
          mode?: string
          other_business_number?: string | null
          phone?: string | null
          shipping_address?: string
          shop_name?: string
          shopify_customer_id?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wholesale_signups: {
        Row: {
          company: string | null
          country: string | null
          created_at: string
          email: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_sales_aggregated: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: {
          cumulative_retail: number
          cumulative_total: number
          cumulative_wholesale: number
          date: string
        }[]
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "roaster"
        | "coffeeshop"
        | "consumer"
        | "trader"
        | "cupper"
        | "producer"
      batch_cost_category:
        | "GREEN"
        | "INBOUND_LOGISTICS"
        | "INTEREST"
        | "WAREHOUSE"
        | "ROASTING_ENERGY"
        | "ROASTING_LABOR_OVERHEAD"
        | "ROASTING_DEPRECIATION"
        | "OTHER"
      category_type: "COGS" | "SGA" | "CAPEX"
      coffee_status: "draft" | "published"
      depreciation_method: "STRAIGHT_LINE"
      expense_source: "COGS" | "SGA" | "CAPEX"
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
    Enums: {
      app_role: [
        "admin",
        "roaster",
        "coffeeshop",
        "consumer",
        "trader",
        "cupper",
        "producer",
      ],
      batch_cost_category: [
        "GREEN",
        "INBOUND_LOGISTICS",
        "INTEREST",
        "WAREHOUSE",
        "ROASTING_ENERGY",
        "ROASTING_LABOR_OVERHEAD",
        "ROASTING_DEPRECIATION",
        "OTHER",
      ],
      category_type: ["COGS", "SGA", "CAPEX"],
      coffee_status: ["draft", "published"],
      depreciation_method: ["STRAIGHT_LINE"],
      expense_source: ["COGS", "SGA", "CAPEX"],
    },
  },
} as const
