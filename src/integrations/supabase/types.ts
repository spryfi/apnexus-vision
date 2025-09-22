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
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      agreements: {
        Row: {
          base_price: number
          contract_html: string | null
          contract_pdf_url: string | null
          created_at: string | null
          discount_percent: number
          final_price: number
          id: string
          lead_id: string | null
          plan: string
          signed_at: string | null
          signed_full_name: string
          term_months: number
          updated_at: string | null
        }
        Insert: {
          base_price: number
          contract_html?: string | null
          contract_pdf_url?: string | null
          created_at?: string | null
          discount_percent: number
          final_price: number
          id?: string
          lead_id?: string | null
          plan: string
          signed_at?: string | null
          signed_full_name: string
          term_months: number
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          contract_html?: string | null
          contract_pdf_url?: string | null
          created_at?: string | null
          discount_percent?: number
          final_price?: number
          id?: string
          lead_id?: string | null
          plan?: string
          signed_at?: string | null
          signed_full_name?: string
          term_months?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreements_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_fresh"
            referencedColumns: ["id"]
          },
        ]
      }
      anchor_address: {
        Row: {
          address_line1: string
          address_line2: string | null
          cb_qualification_data: Json | null
          city: string
          created_at: string | null
          first_lead_id: string | null
          gis_checked_at: string | null
          gis_coverage_attributes: Json | null
          gis_coverage_layers: string[] | null
          gis_coverage_signal: number | null
          gis_coverage_status: string | null
          gis_minsignal: number | null
          gis_qualification_id: string | null
          gis_qualified: boolean | null
          gis_query_checked_at: string | null
          id: string
          is_cb_valid: boolean | null
          last_qualified_at: string | null
          latitude: number | null
          longitude: number | null
          map_snapshot_url: string | null
          qualification_source: string | null
          qualified_at: string | null
          qualified_cband: boolean | null
          raw_bot_data: Json | null
          raw_verizon_data: Json | null
          site_coverage: string[] | null
          site_coverage_checked_at: string | null
          site_coverage_source: string | null
          state: string
          status: string | null
          zip_code: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          cb_qualification_data?: Json | null
          city: string
          created_at?: string | null
          first_lead_id?: string | null
          gis_checked_at?: string | null
          gis_coverage_attributes?: Json | null
          gis_coverage_layers?: string[] | null
          gis_coverage_signal?: number | null
          gis_coverage_status?: string | null
          gis_minsignal?: number | null
          gis_qualification_id?: string | null
          gis_qualified?: boolean | null
          gis_query_checked_at?: string | null
          id?: string
          is_cb_valid?: boolean | null
          last_qualified_at?: string | null
          latitude?: number | null
          longitude?: number | null
          map_snapshot_url?: string | null
          qualification_source?: string | null
          qualified_at?: string | null
          qualified_cband?: boolean | null
          raw_bot_data?: Json | null
          raw_verizon_data?: Json | null
          site_coverage?: string[] | null
          site_coverage_checked_at?: string | null
          site_coverage_source?: string | null
          state: string
          status?: string | null
          zip_code: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          cb_qualification_data?: Json | null
          city?: string
          created_at?: string | null
          first_lead_id?: string | null
          gis_checked_at?: string | null
          gis_coverage_attributes?: Json | null
          gis_coverage_layers?: string[] | null
          gis_coverage_signal?: number | null
          gis_coverage_status?: string | null
          gis_minsignal?: number | null
          gis_qualification_id?: string | null
          gis_qualified?: boolean | null
          gis_query_checked_at?: string | null
          id?: string
          is_cb_valid?: boolean | null
          last_qualified_at?: string | null
          latitude?: number | null
          longitude?: number | null
          map_snapshot_url?: string | null
          qualification_source?: string | null
          qualified_at?: string | null
          qualified_cband?: boolean | null
          raw_bot_data?: Json | null
          raw_verizon_data?: Json | null
          site_coverage?: string[] | null
          site_coverage_checked_at?: string | null
          site_coverage_source?: string | null
          state?: string
          status?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "anchor_address_first_lead_id_fkey"
            columns: ["first_lead_id"]
            isOneToOne: false
            referencedRelation: "leads_fresh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anchor_address_gis_qualification_id_fkey"
            columns: ["gis_qualification_id"]
            isOneToOne: false
            referencedRelation: "gis_qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      anchor_qualification: {
        Row: {
          anchor_address_id: string | null
          created_at: string | null
          id: string
          network_type: string | null
          qualification_source: string | null
          qualified: boolean | null
          raw_data: Json | null
          raw_text: string | null
          request_id: string | null
          source: string
        }
        Insert: {
          anchor_address_id?: string | null
          created_at?: string | null
          id?: string
          network_type?: string | null
          qualification_source?: string | null
          qualified?: boolean | null
          raw_data?: Json | null
          raw_text?: string | null
          request_id?: string | null
          source: string
        }
        Update: {
          anchor_address_id?: string | null
          created_at?: string | null
          id?: string
          network_type?: string | null
          qualification_source?: string | null
          qualified?: boolean | null
          raw_data?: Json | null
          raw_text?: string | null
          request_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "anchor_qualification_anchor_address_id_fkey"
            columns: ["anchor_address_id"]
            isOneToOne: false
            referencedRelation: "anchor_address"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anchor_qualification_anchor_address_id_fkey"
            columns: ["anchor_address_id"]
            isOneToOne: false
            referencedRelation: "lead_qualification_view"
            referencedColumns: ["anchor_address_id"]
          },
          {
            foreignKeyName: "fk_anchor_address"
            columns: ["anchor_address_id"]
            isOneToOne: false
            referencedRelation: "anchor_address"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_anchor_address"
            columns: ["anchor_address_id"]
            isOneToOne: false
            referencedRelation: "lead_qualification_view"
            referencedColumns: ["anchor_address_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          changed_by_initials: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          changed_by_initials?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          changed_by_initials?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      batches: {
        Row: {
          batch_code_barcode: string | null
          closed_at: string | null
          code: string | null
          created_at: string | null
          created_by: string | null
          delivered_units: number | null
          id: string
          status: string | null
          total_units: number | null
        }
        Insert: {
          batch_code_barcode?: string | null
          closed_at?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_units?: number | null
          id?: string
          status?: string | null
          total_units?: number | null
        }
        Update: {
          batch_code_barcode?: string | null
          closed_at?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_units?: number | null
          id?: string
          status?: string | null
          total_units?: number | null
        }
        Relationships: []
      }
      billing_log: {
        Row: {
          amount: number | null
          created_at: string
          customer_id: string
          description: string
          event_type: string
          id: string
          metadata: Json | null
          performed_by: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          customer_id: string
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          customer_id?: string
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_log_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "customer_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sends: {
        Row: {
          bounced: boolean | null
          campaign_id: string | null
          clicked: boolean | null
          delivered: boolean | null
          event_log: Json | null
          id: string
          lead_id: string | null
          notes: string | null
          opened: boolean | null
          replied: boolean | null
          sent_at: string | null
          spamreported: boolean | null
          unsubscribed: boolean | null
          variant_id: string | null
        }
        Insert: {
          bounced?: boolean | null
          campaign_id?: string | null
          clicked?: boolean | null
          delivered?: boolean | null
          event_log?: Json | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          opened?: boolean | null
          replied?: boolean | null
          sent_at?: string | null
          spamreported?: boolean | null
          unsubscribed?: boolean | null
          variant_id?: string | null
        }
        Update: {
          bounced?: boolean | null
          campaign_id?: string | null
          clicked?: boolean | null
          delivered?: boolean | null
          event_log?: Json | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          opened?: boolean | null
          replied?: boolean | null
          sent_at?: string | null
          spamreported?: boolean | null
          unsubscribed?: boolean | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_stats"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_fresh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "template_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variant_stats"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          rotate_variants: boolean | null
          template_id: string
          type: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          rotate_variants?: boolean | null
          template_id: string
          type?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          rotate_variants?: boolean | null
          template_id?: string
          type?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      company_cards: {
        Row: {
          assigned_to: string | null
          card_brand: string
          card_type: string
          cardholder_name: string
          created_at: string | null
          driver_number: string | null
          first_four: string
          id: string
          is_active: boolean | null
          last_four: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          card_brand: string
          card_type: string
          cardholder_name: string
          created_at?: string | null
          driver_number?: string | null
          first_four: string
          id?: string
          is_active?: boolean | null
          last_four: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          card_brand?: string
          card_type?: string
          cardholder_name?: string
          created_at?: string | null
          driver_number?: string | null
          first_four?: string
          id?: string
          is_active?: boolean | null
          last_four?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_cards_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credits: {
        Row: {
          amount: number
          applied_to_invoice: string | null
          created_at: string
          created_by: string | null
          credit_type: string
          customer_id: string
          description: string | null
          id: string
        }
        Insert: {
          amount: number
          applied_to_invoice?: string | null
          created_at?: string
          created_by?: string | null
          credit_type: string
          customer_id: string
          description?: string | null
          id?: string
        }
        Update: {
          amount?: number
          applied_to_invoice?: string | null
          created_at?: string
          created_by?: string | null
          credit_type?: string
          customer_id?: string
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_subscriptions: {
        Row: {
          contract_term: number | null
          created_at: string
          customer_id: string
          device_activated_at: string | null
          id: string
          locked_rate: boolean
          monthly_price: number
          next_charge_date: string | null
          plan_name: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          contract_term?: number | null
          created_at?: string
          customer_id: string
          device_activated_at?: string | null
          id?: string
          locked_rate?: boolean
          monthly_price: number
          next_charge_date?: string | null
          plan_name: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          contract_term?: number | null
          created_at?: string
          customer_id?: string
          device_activated_at?: string | null
          id?: string
          locked_rate?: boolean
          monthly_price?: number
          next_charge_date?: string | null
          plan_name?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          activation_fee_paid: number | null
          address: string | null
          address_line1: string | null
          address_line2: string | null
          checkout_completed_at: string | null
          city: string | null
          created_at: string | null
          created_from_payment_id: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          lead_id: string | null
          phone: string | null
          provisioning_status:
            | Database["public"]["Enums"]["provisioning_status_type"]
            | null
          shipping_cost_paid: number | null
          state: string | null
          status: string | null
          stripe_customer_id: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          activation_fee_paid?: number | null
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          checkout_completed_at?: string | null
          city?: string | null
          created_at?: string | null
          created_from_payment_id?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          lead_id?: string | null
          phone?: string | null
          provisioning_status?:
            | Database["public"]["Enums"]["provisioning_status_type"]
            | null
          shipping_cost_paid?: number | null
          state?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          activation_fee_paid?: number | null
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          checkout_completed_at?: string | null
          city?: string | null
          created_at?: string | null
          created_from_payment_id?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          lead_id?: string | null
          phone?: string | null
          provisioning_status?:
            | Database["public"]["Enums"]["provisioning_status_type"]
            | null
          shipping_cost_paid?: number | null
          state?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_fresh"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_marketing: {
        Row: {
          added_at: string | null
          address: string | null
          email: string
          id: string
          last_email_sent_at: string | null
          last_seen_at: string | null
          lead_id: string | null
          name: string | null
          notes: string | null
          qualified: boolean | null
          status: string | null
        }
        Insert: {
          added_at?: string | null
          address?: string | null
          email: string
          id?: string
          last_email_sent_at?: string | null
          last_seen_at?: string | null
          lead_id?: string | null
          name?: string | null
          notes?: string | null
          qualified?: boolean | null
          status?: string | null
        }
        Update: {
          added_at?: string | null
          address?: string | null
          email?: string
          id?: string
          last_email_sent_at?: string | null
          last_seen_at?: string | null
          lead_id?: string | null
          name?: string | null
          notes?: string | null
          qualified?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drip_marketing_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          clicked_at: string | null
          email_type: string | null
          id: string
          lead_id: string | null
          opened_at: string | null
          sent_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          clicked_at?: string | null
          email_type?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          clicked_at?: string | null
          email_type?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "plan_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tracking: {
        Row: {
          clicked_at: string | null
          drip_marketing_id: string | null
          email_type: string
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          clicked_at?: string | null
          drip_marketing_id?: string | null
          email_type: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          clicked_at?: string | null
          drip_marketing_id?: string | null
          email_type?: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_drip_marketing_id_fkey"
            columns: ["drip_marketing_id"]
            isOneToOne: false
            referencedRelation: "drip_marketing"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verifications: {
        Row: {
          code: string
          created_at: string | null
          email: string
          id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          id?: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          employee_name: string
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_name: string
          id?: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_name?: string
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          category_name: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      flagged_transactions: {
        Row: {
          flag_reason: string
          flagged_at: string | null
          id: string
          original_transaction_id: string
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          transaction_data: Json
        }
        Insert: {
          flag_reason: string
          flagged_at?: string | null
          id?: string
          original_transaction_id: string
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          transaction_data: Json
        }
        Update: {
          flag_reason?: string
          flagged_at?: string | null
          id?: string
          original_transaction_id?: string
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          transaction_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "flagged_transactions_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_transactions: {
        Row: {
          card_number: string | null
          cost_per_gallon: number
          created_at: string
          driver_name: string
          gallons: number
          id: string
          location: string
          odometer_reading: number | null
          total_cost: number
          transaction_date: string
          updated_at: string
          vehicle: string
        }
        Insert: {
          card_number?: string | null
          cost_per_gallon: number
          created_at?: string
          driver_name: string
          gallons: number
          id?: string
          location: string
          odometer_reading?: number | null
          total_cost: number
          transaction_date: string
          updated_at?: string
          vehicle: string
        }
        Update: {
          card_number?: string | null
          cost_per_gallon?: number
          created_at?: string
          driver_name?: string
          gallons?: number
          id?: string
          location?: string
          odometer_reading?: number | null
          total_cost?: number
          transaction_date?: string
          updated_at?: string
          vehicle?: string
        }
        Relationships: []
      }
      fuel_transactions_new: {
        Row: {
          cost_per_gallon: number
          created_at: string
          employee_name: string
          flag_reason: string | null
          gallons: number
          id: string
          merchant_name: string | null
          odometer: number
          source_transaction_id: string | null
          status: string
          total_cost: number
          transaction_date: string
          transaction_type: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          cost_per_gallon: number
          created_at?: string
          employee_name: string
          flag_reason?: string | null
          gallons: number
          id?: string
          merchant_name?: string | null
          odometer: number
          source_transaction_id?: string | null
          status?: string
          total_cost: number
          transaction_date: string
          transaction_type?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          cost_per_gallon?: number
          created_at?: string
          employee_name?: string
          flag_reason?: string | null
          gallons?: number
          id?: string
          merchant_name?: string | null
          odometer?: number
          source_transaction_id?: string | null
          status?: string
          total_cost?: number
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      gis_qualifications: {
        Row: {
          anchor_address_id: string
          brandname: string | null
          created_at: string
          fid: number | null
          id: string
          mindown: number | null
          minsignal: number | null
          minup: number | null
          providerid: string | null
          qualification_reason: string | null
          qualified: boolean
          raw_attributes: Json | null
          technology: string | null
        }
        Insert: {
          anchor_address_id: string
          brandname?: string | null
          created_at?: string
          fid?: number | null
          id?: string
          mindown?: number | null
          minsignal?: number | null
          minup?: number | null
          providerid?: string | null
          qualification_reason?: string | null
          qualified: boolean
          raw_attributes?: Json | null
          technology?: string | null
        }
        Update: {
          anchor_address_id?: string
          brandname?: string | null
          created_at?: string
          fid?: number | null
          id?: string
          mindown?: number | null
          minsignal?: number | null
          minup?: number | null
          providerid?: string | null
          qualification_reason?: string | null
          qualified?: boolean
          raw_attributes?: Json | null
          technology?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gis_qualifications_anchor_address_id_fkey"
            columns: ["anchor_address_id"]
            isOneToOne: false
            referencedRelation: "anchor_address"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gis_qualifications_anchor_address_id_fkey"
            columns: ["anchor_address_id"]
            isOneToOne: false
            referencedRelation: "lead_qualification_view"
            referencedColumns: ["anchor_address_id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
          used?: boolean
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          location: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string
          status: string
          technician_id: string | null
          technician_name: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          location: string
          notes?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: string
          technician_id?: string | null
          technician_name?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          location?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          technician_id?: string | null
          technician_name?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "service_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          added_by: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          note: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          note: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "plan_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          description: string | null
          source_key: string
          source_name: string
        }
        Insert: {
          description?: string | null
          source_key: string
          source_name: string
        }
        Update: {
          description?: string | null
          source_key?: string
          source_name?: string
        }
        Relationships: []
      }
      lead_tags: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          tag: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          tag?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "plan_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_usage_map: {
        Row: {
          lead_id: string
          usage_key: string
        }
        Insert: {
          lead_id: string
          usage_key: string
        }
        Update: {
          lead_id?: string
          usage_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_usage_map_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "plan_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_usage_map_usage_key_fkey"
            columns: ["usage_key"]
            isOneToOne: false
            referencedRelation: "usage_type_options"
            referencedColumns: ["key"]
          },
        ]
      }
      leads: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          qualification_checked_at: string | null
          qualified: boolean | null
          state: string
          updated_at: string | null
          usage_types: string[] | null
          zip_code: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          qualification_checked_at?: string | null
          qualified?: boolean | null
          state: string
          updated_at?: string | null
          usage_types?: string[] | null
          zip_code: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          qualification_checked_at?: string | null
          qualified?: boolean | null
          state?: string
          updated_at?: string | null
          usage_types?: string[] | null
          zip_code?: string
        }
        Relationships: []
      }
      leads_fresh: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          anchor_address_id: string | null
          city: string | null
          created_at: string | null
          discounted_price: number | null
          email: string | null
          fallback_used: boolean | null
          first_name: string | null
          gis_coverage_attributes: Json | null
          gis_coverage_layers: string[] | null
          gis_coverage_signal: number | null
          gis_coverage_status: string | null
          gis_query_checked_at: string | null
          household_size: number | null
          id: string
          is_test: boolean | null
          last_emailed_at: string | null
          last_name: string | null
          lead_type: string | null
          override_at: string | null
          override_by: string | null
          override_reason: string | null
          phone: string | null
          promo_code: string | null
          promo_code_discount_percent: number | null
          promo_code_plan_override: string | null
          qualification_checked_at: string | null
          qualification_override: boolean | null
          qualification_result: string | null
          qualification_source: string | null
          qualified: boolean | null
          reason: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          usage_type: string | null
          usage_types: string[] | null
          verizon_api_confidence: number | null
          verizon_api_response: Json | null
          verizon_checked_at: string | null
          verizon_map_screenshot: string | null
          verizon_network_type: string | null
          verizon_qualification_source: string | null
          verizon_qualified: boolean | null
          verizon_screenshot_captured_at: string | null
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          anchor_address_id?: string | null
          city?: string | null
          created_at?: string | null
          discounted_price?: number | null
          email?: string | null
          fallback_used?: boolean | null
          first_name?: string | null
          gis_coverage_attributes?: Json | null
          gis_coverage_layers?: string[] | null
          gis_coverage_signal?: number | null
          gis_coverage_status?: string | null
          gis_query_checked_at?: string | null
          household_size?: number | null
          id?: string
          is_test?: boolean | null
          last_emailed_at?: string | null
          last_name?: string | null
          lead_type?: string | null
          override_at?: string | null
          override_by?: string | null
          override_reason?: string | null
          phone?: string | null
          promo_code?: string | null
          promo_code_discount_percent?: number | null
          promo_code_plan_override?: string | null
          qualification_checked_at?: string | null
          qualification_override?: boolean | null
          qualification_result?: string | null
          qualification_source?: string | null
          qualified?: boolean | null
          reason?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          usage_type?: string | null
          usage_types?: string[] | null
          verizon_api_confidence?: number | null
          verizon_api_response?: Json | null
          verizon_checked_at?: string | null
          verizon_map_screenshot?: string | null
          verizon_network_type?: string | null
          verizon_qualification_source?: string | null
          verizon_qualified?: boolean | null
          verizon_screenshot_captured_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          anchor_address_id?: string | null
          city?: string | null
          created_at?: string | null
          discounted_price?: number | null
          email?: string | null
          fallback_used?: boolean | null
          first_name?: string | null
          gis_coverage_attributes?: Json | null
          gis_coverage_layers?: string[] | null
          gis_coverage_signal?: number | null
          gis_coverage_status?: string | null
          gis_query_checked_at?: string | null
          household_size?: number | null
          id?: string
          is_test?: boolean | null
          last_emailed_at?: string | null
          last_name?: string | null
          lead_type?: string | null
          override_at?: string | null
          override_by?: string | null
          override_reason?: string | null
          phone?: string | null
          promo_code?: string | null
          promo_code_discount_percent?: number | null
          promo_code_plan_override?: string | null
          qualification_checked_at?: string | null
          qualification_override?: boolean | null
          qualification_result?: string | null
          qualification_source?: string | null
          qualified?: boolean | null
          reason?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          usage_type?: string | null
          usage_types?: string[] | null
          verizon_api_confidence?: number | null
          verizon_api_response?: Json | null
          verizon_checked_at?: string | null
          verizon_map_screenshot?: string | null
          verizon_network_type?: string | null
          verizon_qualification_source?: string | null
          verizon_qualified?: boolean | null
          verizon_screenshot_captured_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_fresh_anchor_address_id_fkey"
            columns: ["anchor_address_id"]
            isOneToOne: false
            referencedRelation: "anchor_address"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_fresh_anchor_address_id_fkey"
            columns: ["anchor_address_id"]
            isOneToOne: false
            referencedRelation: "lead_qualification_view"
            referencedColumns: ["anchor_address_id"]
          },
        ]
      }
      leads_qualifications: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          network_type: string | null
          qualified: boolean | null
          raw_data: Json | null
          request_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          network_type?: string | null
          qualified?: boolean | null
          raw_data?: Json | null
          request_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          network_type?: string | null
          qualified?: boolean | null
          raw_data?: Json | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_id"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_fresh"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_leads: {
        Row: {
          cleaned_at: string | null
          file_hash: string | null
          full_row: Json
          id: string
          lat: number | null
          lng: number | null
          record_hash: string | null
          source_file: string | null
          status: string | null
        }
        Insert: {
          cleaned_at?: string | null
          file_hash?: string | null
          full_row: Json
          id?: string
          lat?: number | null
          lng?: number | null
          record_hash?: string | null
          source_file?: string | null
          status?: string | null
        }
        Update: {
          cleaned_at?: string | null
          file_hash?: string | null
          full_row?: Json
          id?: string
          lat?: number | null
          lng?: number | null
          record_hash?: string | null
          source_file?: string | null
          status?: string | null
        }
        Relationships: []
      }
      maintenance_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          maintenance_record_id: string
          part_number: string | null
          quantity: number
          total_price: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          maintenance_record_id: string
          part_number?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          maintenance_record_id?: string
          part_number?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_line_items_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          cost: number
          created_at: string
          id: string
          odometer_at_service: number
          receipt_scan_url: string | null
          service_date: string
          service_description: string
          service_provider_vendor_id: string | null
          service_summary: string | null
          status: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          id?: string
          odometer_at_service: number
          receipt_scan_url?: string | null
          service_date: string
          service_description: string
          service_provider_vendor_id?: string | null
          service_summary?: string | null
          status?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          odometer_at_service?: number
          receipt_scan_url?: string | null
          service_date?: string
          service_description?: string
          service_provider_vendor_id?: string | null
          service_summary?: string | null
          status?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_service_provider_vendor_id_fkey"
            columns: ["service_provider_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      odometer_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          created_at: string
          id: string
          new_reading: number
          notes: string | null
          previous_reading: number | null
          vehicle_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_reading: number
          notes?: string | null
          previous_reading?: number | null
          vehicle_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_reading?: number
          notes?: string | null
          previous_reading?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "odometer_log_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_events: {
        Row: {
          customer_id: string | null
          event_type: string | null
          id: string
          timestamp: string | null
          value: string | null
        }
        Insert: {
          customer_id?: string | null
          event_type?: string | null
          id?: string
          timestamp?: string | null
          value?: string | null
        }
        Update: {
          customer_id?: string | null
          event_type?: string | null
          id?: string
          timestamp?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_sessions: {
        Row: {
          agreements: Json | null
          auto_generated: boolean | null
          code_expires_at: string | null
          created_at: string | null
          current_step: number | null
          device_count: string | null
          discount_total: number | null
          email_address: string | null
          email_verified: boolean | null
          id: string
          lead_id: string | null
          monthly_price: number | null
          plan_recommended: string | null
          referrer_id: string | null
          referrer_name: string | null
          secure_mode: string | null
          social_platform: string | null
          social_post_url: string | null
          ssid: string | null
          term_length: number | null
          updated_at: string | null
          usage_types: string[] | null
          verification_code: string | null
          wifi_password: string | null
          works_from_home: boolean | null
        }
        Insert: {
          agreements?: Json | null
          auto_generated?: boolean | null
          code_expires_at?: string | null
          created_at?: string | null
          current_step?: number | null
          device_count?: string | null
          discount_total?: number | null
          email_address?: string | null
          email_verified?: boolean | null
          id?: string
          lead_id?: string | null
          monthly_price?: number | null
          plan_recommended?: string | null
          referrer_id?: string | null
          referrer_name?: string | null
          secure_mode?: string | null
          social_platform?: string | null
          social_post_url?: string | null
          ssid?: string | null
          term_length?: number | null
          updated_at?: string | null
          usage_types?: string[] | null
          verification_code?: string | null
          wifi_password?: string | null
          works_from_home?: boolean | null
        }
        Update: {
          agreements?: Json | null
          auto_generated?: boolean | null
          code_expires_at?: string | null
          created_at?: string | null
          current_step?: number | null
          device_count?: string | null
          discount_total?: number | null
          email_address?: string | null
          email_verified?: boolean | null
          id?: string
          lead_id?: string | null
          monthly_price?: number | null
          plan_recommended?: string | null
          referrer_id?: string | null
          referrer_name?: string | null
          secure_mode?: string | null
          social_platform?: string | null
          social_post_url?: string | null
          ssid?: string | null
          term_length?: number | null
          updated_at?: string | null
          usage_types?: string[] | null
          verification_code?: string | null
          wifi_password?: string | null
          works_from_home?: boolean | null
        }
        Relationships: []
      }
      onera_wifi: {
        Row: {
          created_at: string
          email: string
          guest_location: string | null
          how_found_us: string
          how_found_us_other: string | null
          id: string
          ip_address: string | null
          last_name: string
          mac_address: string | null
          marketing_opt_in: string
          phone: string | null
          phone_normalized: string | null
          room_name: string
          submitted_at: string
          ts: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          guest_location?: string | null
          how_found_us: string
          how_found_us_other?: string | null
          id?: string
          ip_address?: string | null
          last_name: string
          mac_address?: string | null
          marketing_opt_in?: string
          phone?: string | null
          phone_normalized?: string | null
          room_name: string
          submitted_at?: string
          ts?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          guest_location?: string | null
          how_found_us?: string
          how_found_us_other?: string | null
          id?: string
          ip_address?: string | null
          last_name?: string
          mac_address?: string | null
          marketing_opt_in?: string
          phone?: string | null
          phone_normalized?: string | null
          room_name?: string
          submitted_at?: string
          ts?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          fulfillment_status: string
          id: string
          payment_status: string
          plan_id: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          fulfillment_status?: string
          id?: string
          payment_status?: string
          plan_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          fulfillment_status?: string
          id?: string
          payment_status?: string
          plan_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "service_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "service_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_details: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          method_name: string
          method_type: string
          updated_at: string | null
        }
        Insert: {
          account_details?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          method_name: string
          method_type: string
          updated_at?: string | null
        }
        Update: {
          account_details?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          method_name?: string
          method_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          payment_type: string
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          payment_type: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          payment_type?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_fresh"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          created_at: string
          deductions: number | null
          employee_id: string
          gross_pay: number
          hourly_rate: number | null
          hours_worked: number | null
          id: string
          is_salary: boolean | null
          net_pay: number | null
          notes: string | null
          overtime_hours: number | null
          overtime_pay: number | null
          pay_date: string | null
          pay_period_end: string
          pay_period_start: string
          regular_hours: number | null
          total_gross_pay: number
          updated_at: string
          week_end_date: string | null
          week_number: number | null
          week_start_date: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          deductions?: number | null
          employee_id: string
          gross_pay: number
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          is_salary?: boolean | null
          net_pay?: number | null
          notes?: string | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          pay_date?: string | null
          pay_period_end: string
          pay_period_start: string
          regular_hours?: number | null
          total_gross_pay: number
          updated_at?: string
          week_end_date?: string | null
          week_number?: number | null
          week_start_date?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          deductions?: number | null
          employee_id?: string
          gross_pay?: number
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          is_salary?: boolean | null
          net_pay?: number | null
          notes?: string | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          pay_date?: string | null
          pay_period_end?: string
          pay_period_start?: string
          regular_hours?: number | null
          total_gross_pay?: number
          updated_at?: string
          week_end_date?: string | null
          week_number?: number | null
          week_start_date?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_leads: {
        Row: {
          address: string
          city: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          lead_source: string | null
          recommended_plan: string | null
          status: string | null
          usage_score: number | null
          usage_type: string | null
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          lead_source?: string | null
          recommended_plan?: string | null
          status?: string | null
          usage_score?: number | null
          usage_type?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          lead_source?: string | null
          recommended_plan?: string | null
          status?: string | null
          usage_score?: number | null
          usage_type?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          retail_price: number | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          retail_price?: number | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          retail_price?: number | null
        }
        Relationships: []
      }
      processed_files: {
        Row: {
          file_hash: string
          file_name: string
          id: string
          processed_at: string | null
          processed_by: string | null
          record_count: number
        }
        Insert: {
          file_hash: string
          file_name: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          record_count?: number
        }
        Update: {
          file_hash?: string
          file_name?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          record_count?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          taxable: boolean
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          taxable?: boolean
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          taxable?: boolean
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      project_antennas: {
        Row: {
          azimuth_center_deg: number | null
          beamwidth_deg: number | null
          created_at: string | null
          id: string
          name: string
          pattern_rows: Json | null
          pattern_url: string | null
          peak_gain_dbi: number | null
          project_id: string
        }
        Insert: {
          azimuth_center_deg?: number | null
          beamwidth_deg?: number | null
          created_at?: string | null
          id?: string
          name: string
          pattern_rows?: Json | null
          pattern_url?: string | null
          peak_gain_dbi?: number | null
          project_id: string
        }
        Update: {
          azimuth_center_deg?: number | null
          beamwidth_deg?: number | null
          created_at?: string | null
          id?: string
          name?: string
          pattern_rows?: Json | null
          pattern_url?: string | null
          peak_gain_dbi?: number | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_antennas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          inputs: Json
          name: string
          owner: string | null
          public: boolean | null
          results: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          inputs: Json
          name: string
          owner?: string | null
          public?: boolean | null
          results: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          inputs?: Json
          name?: string
          owner?: string | null
          public?: boolean | null
          results?: Json
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          discount_percent: number
          is_active: boolean | null
          offer_type: string | null
          plan_override: string | null
          usage_count: number | null
          usage_limit: number | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_percent?: number
          is_active?: boolean | null
          offer_type?: string | null
          plan_override?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_percent?: number
          is_active?: boolean | null
          offer_type?: string | null
          plan_override?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_until?: string | null
        }
        Relationships: []
      }
      provisioning_events: {
        Row: {
          action: string
          id: string
          notes: string | null
          performed_by: string | null
          router_id: string | null
          timestamp: string | null
        }
        Insert: {
          action: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          router_id?: string | null
          timestamp?: string | null
        }
        Update: {
          action?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          router_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_events_router_id_fkey"
            columns: ["router_id"]
            isOneToOne: false
            referencedRelation: "routers"
            referencedColumns: ["id"]
          },
        ]
      }
      provisioning_sessions: {
        Row: {
          assemble_option: string | null
          assembled: boolean | null
          assembled_at: string | null
          assembled_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          current_step: string | null
          customer_id: string | null
          id: string
          last_updated_at: string | null
          last_updated_by: string | null
          lead_id: string | null
          passkey: string | null
          plan_added: boolean | null
          router_id: string | null
          ssid: string | null
          ssid_confirmed: boolean | null
          ssid_confirmed_at: string | null
          ssid_printed: boolean | null
          status: string | null
          verizon_added_at: string | null
          verizon_added_by: string | null
          verizon_plan_name: string | null
        }
        Insert: {
          assemble_option?: string | null
          assembled?: boolean | null
          assembled_at?: string | null
          assembled_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          current_step?: string | null
          customer_id?: string | null
          id?: string
          last_updated_at?: string | null
          last_updated_by?: string | null
          lead_id?: string | null
          passkey?: string | null
          plan_added?: boolean | null
          router_id?: string | null
          ssid?: string | null
          ssid_confirmed?: boolean | null
          ssid_confirmed_at?: string | null
          ssid_printed?: boolean | null
          status?: string | null
          verizon_added_at?: string | null
          verizon_added_by?: string | null
          verizon_plan_name?: string | null
        }
        Update: {
          assemble_option?: string | null
          assembled?: boolean | null
          assembled_at?: string | null
          assembled_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          current_step?: string | null
          customer_id?: string | null
          id?: string
          last_updated_at?: string | null
          last_updated_by?: string | null
          lead_id?: string | null
          passkey?: string | null
          plan_added?: boolean | null
          router_id?: string | null
          ssid?: string | null
          ssid_confirmed?: boolean | null
          ssid_confirmed_at?: string | null
          ssid_printed?: boolean | null
          status?: string | null
          verizon_added_at?: string | null
          verizon_added_by?: string | null
          verizon_plan_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_sessions_router_id_fkey"
            columns: ["router_id"]
            isOneToOne: false
            referencedRelation: "routers"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          created_at: string
          created_by: string | null
          day_of_month_to_generate: number
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          next_generation_date: string
          template_transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_of_month_to_generate: number
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          next_generation_date: string
          template_transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_of_month_to_generate?: number
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          next_generation_date?: string
          template_transaction_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_applied: boolean | null
          created_at: string | null
          id: string
          referred_lead_id: string
          referrer_id: string
        }
        Insert: {
          bonus_applied?: boolean | null
          created_at?: string | null
          id?: string
          referred_lead_id: string
          referrer_id: string
        }
        Update: {
          bonus_applied?: boolean | null
          created_at?: string | null
          id?: string
          referred_lead_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      request_lookup: {
        Row: {
          anchor_address_id: string | null
          created_at: string | null
          extended_search_started: boolean | null
          form_data: Json | null
          network_type: string | null
          qualification_status: string | null
          qualified: boolean | null
          request_id: string
          source: string | null
          verizon_request_id: string | null
        }
        Insert: {
          anchor_address_id?: string | null
          created_at?: string | null
          extended_search_started?: boolean | null
          form_data?: Json | null
          network_type?: string | null
          qualification_status?: string | null
          qualified?: boolean | null
          request_id: string
          source?: string | null
          verizon_request_id?: string | null
        }
        Update: {
          anchor_address_id?: string | null
          created_at?: string | null
          extended_search_started?: boolean | null
          form_data?: Json | null
          network_type?: string | null
          qualification_status?: string | null
          qualified?: boolean | null
          request_id?: string
          source?: string | null
          verizon_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_lookup_anchor_address_id_fkey"
            columns: ["anchor_address_id"]
            isOneToOne: false
            referencedRelation: "anchor_address"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_lookup_anchor_address_id_fkey"
            columns: ["anchor_address_id"]
            isOneToOne: false
            referencedRelation: "lead_qualification_view"
            referencedColumns: ["anchor_address_id"]
          },
        ]
      }
      router_shipments: {
        Row: {
          batch_id: string | null
          carrier: string | null
          confirmed_by: string | null
          cost: number | null
          delivered: boolean | null
          delivered_at: string | null
          id: string
          router_id: string | null
          shipped_at: string | null
          shipping_label_printed: boolean | null
          tracking_barcode: string | null
          tracking_number: string | null
        }
        Insert: {
          batch_id?: string | null
          carrier?: string | null
          confirmed_by?: string | null
          cost?: number | null
          delivered?: boolean | null
          delivered_at?: string | null
          id?: string
          router_id?: string | null
          shipped_at?: string | null
          shipping_label_printed?: boolean | null
          tracking_barcode?: string | null
          tracking_number?: string | null
        }
        Update: {
          batch_id?: string | null
          carrier?: string | null
          confirmed_by?: string | null
          cost?: number | null
          delivered?: boolean | null
          delivered_at?: string | null
          id?: string
          router_id?: string | null
          shipped_at?: string | null
          shipping_label_printed?: boolean | null
          tracking_barcode?: string | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "router_shipments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "router_shipments_router_id_fkey"
            columns: ["router_id"]
            isOneToOne: false
            referencedRelation: "routers"
            referencedColumns: ["id"]
          },
        ]
      }
      routers: {
        Row: {
          asset_tag: string | null
          assigned_client_id: string | null
          barcode: string | null
          billing_cycles: number | null
          country_of_origin: string | null
          created_at: string | null
          created_by: string | null
          iccid: string
          id: string
          imei: string
          model: string
          network_password: string
          notes: string | null
          ownership_flag: boolean | null
          serial_number: string
          service_status: string | null
          shipping_label_printed: boolean | null
          sim_sku: string | null
          status: string | null
          status_qr_last_printed_at: string | null
          status_qr_note: string | null
          status_qr_printed_by: string | null
          sw_version: string | null
          upc: string | null
        }
        Insert: {
          asset_tag?: string | null
          assigned_client_id?: string | null
          barcode?: string | null
          billing_cycles?: number | null
          country_of_origin?: string | null
          created_at?: string | null
          created_by?: string | null
          iccid: string
          id?: string
          imei: string
          model: string
          network_password?: string
          notes?: string | null
          ownership_flag?: boolean | null
          serial_number: string
          service_status?: string | null
          shipping_label_printed?: boolean | null
          sim_sku?: string | null
          status?: string | null
          status_qr_last_printed_at?: string | null
          status_qr_note?: string | null
          status_qr_printed_by?: string | null
          sw_version?: string | null
          upc?: string | null
        }
        Update: {
          asset_tag?: string | null
          assigned_client_id?: string | null
          barcode?: string | null
          billing_cycles?: number | null
          country_of_origin?: string | null
          created_at?: string | null
          created_by?: string | null
          iccid?: string
          id?: string
          imei?: string
          model?: string
          network_password?: string
          notes?: string | null
          ownership_flag?: boolean | null
          serial_number?: string
          service_status?: string | null
          shipping_label_printed?: boolean | null
          sim_sku?: string | null
          status?: string | null
          status_qr_last_printed_at?: string | null
          status_qr_note?: string | null
          status_qr_printed_by?: string | null
          sw_version?: string | null
          upc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routers_assigned_client_id_fkey"
            columns: ["assigned_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          city: string
          created_at: string
          id: string
          is_serviceable: boolean
          max_speed_mbps: number | null
          notes: string | null
          state: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_serviceable?: boolean
          max_speed_mbps?: number | null
          notes?: string | null
          state: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_serviceable?: boolean
          max_speed_mbps?: number | null
          notes?: string | null
          state?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      service_inquiries: {
        Row: {
          address: string
          city: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_qualified: boolean | null
          message: string | null
          phone: string
          plan_id: string | null
          state: string
          status: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_qualified?: boolean | null
          message?: string | null
          phone: string
          plan_id?: string | null
          state: string
          status?: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_qualified?: boolean | null
          message?: string | null
          phone?: string
          plan_id?: string | null
          state?: string
          status?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_inquiries_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "service_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      service_plans: {
        Row: {
          created_at: string
          description: string
          download_speed: number
          features: Json | null
          id: string
          is_active: boolean
          name: string
          price_monthly: number
          updated_at: string
          upload_speed: number
        }
        Insert: {
          created_at?: string
          description: string
          download_speed: number
          features?: Json | null
          id?: string
          is_active?: boolean
          name: string
          price_monthly: number
          updated_at?: string
          upload_speed: number
        }
        Update: {
          created_at?: string
          description?: string
          download_speed?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number
          updated_at?: string
          upload_speed?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      shipping_scan_logs: {
        Row: {
          batch_id: string | null
          carrier: string | null
          id: string
          lat: number | null
          lng: number | null
          location_city: string | null
          location_state: string | null
          router_id: string | null
          scan_time: string | null
          status: string | null
          tracking_number: string | null
        }
        Insert: {
          batch_id?: string | null
          carrier?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_city?: string | null
          location_state?: string | null
          router_id?: string | null
          scan_time?: string | null
          status?: string | null
          tracking_number?: string | null
        }
        Update: {
          batch_id?: string | null
          carrier?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_city?: string | null
          location_state?: string | null
          router_id?: string | null
          scan_time?: string | null
          status?: string | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_scan_logs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_scan_logs_router_id_fkey"
            columns: ["router_id"]
            isOneToOne: false
            referencedRelation: "routers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          active: boolean | null
          base_cost: number
          created_at: string | null
          estimated_days: string
          id: string
          name: string
          states: string[]
          updated_at: string | null
          zone_number: number
        }
        Insert: {
          active?: boolean | null
          base_cost: number
          created_at?: string | null
          estimated_days: string
          id: string
          name: string
          states: string[]
          updated_at?: string | null
          zone_number: number
        }
        Update: {
          active?: boolean | null
          base_cost?: number
          created_at?: string | null
          estimated_days?: string
          id?: string
          name?: string
          states?: string[]
          updated_at?: string | null
          zone_number?: number
        }
        Relationships: []
      }
      social_mentions: {
        Row: {
          credit_applied: boolean | null
          customer_id: string | null
          id: string
          platform: string | null
          post_url: string | null
          submitted_at: string | null
          verified: boolean | null
        }
        Insert: {
          credit_applied?: boolean | null
          customer_id?: string | null
          id?: string
          platform?: string | null
          post_url?: string | null
          submitted_at?: string | null
          verified?: boolean | null
        }
        Update: {
          credit_applied?: boolean | null
          customer_id?: string | null
          id?: string
          platform?: string | null
          post_url?: string | null
          submitted_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "social_mentions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          created_at: string | null
          credit_amount: number | null
          customer_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          platform: string
          post_timestamp: string | null
          post_url: string
          status: string | null
          verified_timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          credit_amount?: number | null
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          platform: string
          post_timestamp?: string | null
          post_url: string
          status?: string | null
          verified_timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          credit_amount?: number | null
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          platform?: string
          post_timestamp?: string | null
          post_url?: string
          status?: string | null
          verified_timestamp?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          must_reset_password: boolean | null
          password_hash: string | null
          role: string
          temp_password: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          must_reset_password?: boolean | null
          password_hash?: string | null
          role: string
          temp_password?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          must_reset_password?: boolean | null
          password_hash?: string | null
          role?: string
          temp_password?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          completion_data: Json | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          status: string
          task_template_id: string
          updated_at: string
          validated_at: string | null
          validation_result: Json | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          completion_data?: Json | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          status?: string
          task_template_id: string
          updated_at?: string
          validated_at?: string | null
          validation_result?: Json | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          completion_data?: Json | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          status?: string
          task_template_id?: string
          updated_at?: string
          validated_at?: string | null
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          required_fields: Json | null
          task_type: string
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          required_fields?: Json | null
          task_type: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          required_fields?: Json | null
          task_type?: string
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      technicians: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      template_variants: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          label: string
          last_used_at: string | null
          template_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          label: string
          last_used_at?: string | null
          template_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          label?: string
          last_used_at?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_stats"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "template_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          total_price: number
          transaction_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          total_price: number
          transaction_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          total_price?: number
          transaction_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_line_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          ai_flag_reason: string | null
          ai_flagged_status: boolean | null
          amount: number
          audit_trail: string | null
          check_number: string | null
          created_at: string
          document_required_override: boolean | null
          due_date: string | null
          employee_id: string
          expense_category_id: string
          id: string
          invoice_date: string
          invoice_number: string | null
          invoice_receipt_url: string | null
          override_by: string | null
          override_reason: string | null
          paid_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_source: string | null
          payment_source_detail: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_memo: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          ai_flag_reason?: string | null
          ai_flagged_status?: boolean | null
          amount: number
          audit_trail?: string | null
          check_number?: string | null
          created_at?: string
          document_required_override?: boolean | null
          due_date?: string | null
          employee_id: string
          expense_category_id: string
          id?: string
          invoice_date: string
          invoice_number?: string | null
          invoice_receipt_url?: string | null
          override_by?: string | null
          override_reason?: string | null
          paid_date?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_source?: string | null
          payment_source_detail?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_memo?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          ai_flag_reason?: string | null
          ai_flagged_status?: boolean | null
          amount?: number
          audit_trail?: string | null
          check_number?: string | null
          created_at?: string
          document_required_override?: boolean | null
          due_date?: string | null
          employee_id?: string
          expense_category_id?: string
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          invoice_receipt_url?: string | null
          override_by?: string | null
          override_reason?: string | null
          paid_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_source?: string | null
          payment_source_detail?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_memo?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_type_options: {
        Row: {
          key: string
          label: string | null
        }
        Insert: {
          key: string
          label?: string | null
        }
        Update: {
          key?: string
          label?: string | null
        }
        Relationships: []
      }
      user_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          performed_by: string | null
          target_email: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          target_email: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          target_email?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          first_name: string
          id: string
          last_name: string
          role: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          expires_at: string
          first_name: string
          id?: string
          last_name: string
          role?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          last_name?: string
          role?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          first_name: string
          id: string
          initials: string
          is_active: boolean
          last_name: string
          role: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          first_name: string
          id?: string
          initials: string
          is_active?: boolean
          last_name: string
          role?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          first_name?: string
          id?: string
          initials?: string
          is_active?: boolean
          last_name?: string
          role?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          must_reset_password: boolean | null
          role: string
          temp_password: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          must_reset_password?: boolean | null
          role: string
          temp_password?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          must_reset_password?: boolean | null
          role?: string
          temp_password?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          asset_id: string
          created_at: string
          current_odometer: number | null
          id: string
          insurance_expiry_date: string | null
          insurance_policy_number: string | null
          license_plate: string | null
          make: string | null
          model: string | null
          registration_expiry_date: string | null
          status: string | null
          updated_at: string
          vehicle_name: string
          vin: string | null
          year: number | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          current_odometer?: number | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_policy_number?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          registration_expiry_date?: string | null
          status?: string | null
          updated_at?: string
          vehicle_name: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          current_odometer?: number | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_policy_number?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          registration_expiry_date?: string | null
          status?: string | null
          updated_at?: string
          vehicle_name?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      vendor_documents: {
        Row: {
          created_at: string
          document_type: string
          expiry_date: string | null
          file_name: string
          file_url: string
          id: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          expiry_date?: string | null
          file_name: string
          file_url: string
          id?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          expiry_date?: string | null
          file_name?: string
          file_url?: string
          id?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          contact_person: string | null
          created_at: string
          default_expense_category_id: string | null
          email: string | null
          full_address: string | null
          id: string
          internal_notes: string | null
          payment_terms: string | null
          phone_number: string | null
          preferred_payment_method: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          status: string | null
          tax_id_ein: string | null
          updated_at: string
          vendor_name: string
          your_account_number: string | null
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          default_expense_category_id?: string | null
          email?: string | null
          full_address?: string | null
          id?: string
          internal_notes?: string | null
          payment_terms?: string | null
          phone_number?: string | null
          preferred_payment_method?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          status?: string | null
          tax_id_ein?: string | null
          updated_at?: string
          vendor_name: string
          your_account_number?: string | null
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          default_expense_category_id?: string | null
          email?: string | null
          full_address?: string | null
          id?: string
          internal_notes?: string | null
          payment_terms?: string | null
          phone_number?: string | null
          preferred_payment_method?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          status?: string | null
          tax_id_ein?: string | null
          updated_at?: string
          vendor_name?: string
          your_account_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_default_expense_category_id_fkey"
            columns: ["default_expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      verizon_addresses: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          request_id: string | null
          response: Json | null
          status: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          request_id?: string | null
          response?: Json | null
          status?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          request_id?: string | null
          response?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string | null
          email: string
          id: string
          source: string | null
          state: string | null
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          id?: string
          source?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          id?: string
          source?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      wifi_signups: {
        Row: {
          email: string | null
          id: number
          ip: string | null
          last_name: string | null
          mac: string | null
          opt_in: boolean | null
          phone: string | null
          referral: string | null
          room: string | null
          ts: string
          user_agent: string | null
        }
        Insert: {
          email?: string | null
          id?: number
          ip?: string | null
          last_name?: string | null
          mac?: string | null
          opt_in?: boolean | null
          phone?: string | null
          referral?: string | null
          room?: string | null
          ts?: string
          user_agent?: string | null
        }
        Update: {
          email?: string | null
          id?: number
          ip?: string | null
          last_name?: string | null
          mac?: string | null
          opt_in?: boolean | null
          phone?: string | null
          referral?: string | null
          room?: string | null
          ts?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      zip_codes: {
        Row: {
          city: string
          created_at: string | null
          state: string
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string | null
          state: string
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string | null
          state?: string
          zip_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      campaign_stats: {
        Row: {
          active: boolean | null
          campaign_id: string | null
          campaign_name: string | null
          click_rate: number | null
          open_rate: number | null
          total_sends: number | null
          type: string | null
          variant_count: number | null
        }
        Relationships: []
      }
      customer_orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          fulfillment_status: string | null
          id: string | null
          payment_status: string | null
          plan_id: string | null
          plan_name: string | null
          status: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "service_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "service_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_qualification_view: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          anchor_address_id: string | null
          city: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          qualified: boolean | null
          qualified_at: string | null
          request_id: string | null
          source: string | null
          state: string | null
          submitted_at: string | null
          usage_types: string | null
          zip_code: string | null
        }
        Relationships: []
      }
      onera_wifi_public: {
        Row: {
          display_ts: string | null
          email: string | null
          guest_location: string | null
          how_found_us: string | null
          id: string | null
          ip_address: string | null
          last_name: string | null
          mac_address: string | null
          phone: string | null
          room_name: string | null
        }
        Insert: {
          display_ts?: never
          email?: string | null
          guest_location?: string | null
          how_found_us?: string | null
          id?: string | null
          ip_address?: string | null
          last_name?: string | null
          mac_address?: string | null
          phone?: string | null
          room_name?: string | null
        }
        Update: {
          display_ts?: never
          email?: string | null
          guest_location?: string | null
          how_found_us?: string | null
          id?: string | null
          ip_address?: string | null
          last_name?: string | null
          mac_address?: string | null
          phone?: string | null
          room_name?: string | null
        }
        Relationships: []
      }
      portal_submissions: {
        Row: {
          email: string | null
          ip: string | null
          location: string | null
          mac: string | null
          name: string | null
          phone: string | null
          referral: string | null
          room: string | null
          ts: string | null
        }
        Insert: {
          email?: string | null
          ip?: string | null
          location?: never
          mac?: string | null
          name?: string | null
          phone?: string | null
          referral?: string | null
          room?: string | null
          ts?: string | null
        }
        Update: {
          email?: string | null
          ip?: string | null
          location?: never
          mac?: string | null
          name?: string | null
          phone?: string | null
          referral?: string | null
          room?: string | null
          ts?: string | null
        }
        Relationships: []
      }
      variant_stats: {
        Row: {
          campaign_id: string | null
          click_rate: number | null
          label: string | null
          last_used_at: string | null
          open_rate: number | null
          template_id: string | null
          total_sent: number | null
          variant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_stats"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "template_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_signups_dedup: {
        Row: {
          dedup_key: string | null
          email: string | null
          id: number | null
          ip: string | null
          last_name: string | null
          mac: string | null
          opt_in: boolean | null
          phone: string | null
          referral: string | null
          room: string | null
          ts: string | null
          user_agent: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      backfill_city_state_from_zip: {
        Args: { zip: string }
        Returns: {
          city: string
          state: string
        }[]
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      calculate_social_credit_amount: {
        Args: { p_customer_id?: string; p_lead_id?: string; p_platform: string }
        Returns: number
      }
      convert_lead_to_customer: {
        Args: {
          p_activation_fee?: number
          p_lead_id: string
          p_shipping_cost: number
          p_stripe_customer_id: string
          p_stripe_payment_intent_id: string
        }
        Returns: string
      }
      create_user_invitation: {
        Args: {
          invitation_email: string
          invitation_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_records_with_missing_city_state: {
        Args: Record<PropertyKey, never>
        Returns: {
          city: string
          id: string
          state: string
          zip: string
        }[]
      }
      get_source_file_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          source_file: string
        }[]
      }
      get_user_role: {
        Args: { user_id?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role_from_jwt: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_spryfi_role: {
        Args: {
          _role: Database["public"]["Enums"]["spryfi_role"]
          _user_id: string
        }
        Returns: boolean
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_file_already_processed: {
        Args: { file_hash: string }
        Returns: boolean
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      update_drip_last_seen: {
        Args: { user_email: string }
        Returns: undefined
      }
      update_leads_with_backfilled_city_state: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      payment_method:
        | "Credit Card"
        | "ACH"
        | "Check"
        | "Fleet Fuel Card"
        | "Debit Card"
      provisioning_status_type:
        | "pending_provisioning"
        | "provisioning"
        | "pending_shipping"
        | "shipped"
        | "activated"
        | "cancelled"
      spryfi_role: "admin" | "networkops" | "viewer"
      transaction_status:
        | "Entry Required"
        | "Pending Approval"
        | "Approved for Payment"
        | "Paid"
        | "Reconciled"
      user_role: "admin" | "office" | "customer"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      payment_method: [
        "Credit Card",
        "ACH",
        "Check",
        "Fleet Fuel Card",
        "Debit Card",
      ],
      provisioning_status_type: [
        "pending_provisioning",
        "provisioning",
        "pending_shipping",
        "shipped",
        "activated",
        "cancelled",
      ],
      spryfi_role: ["admin", "networkops", "viewer"],
      transaction_status: [
        "Entry Required",
        "Pending Approval",
        "Approved for Payment",
        "Paid",
        "Reconciled",
      ],
      user_role: ["admin", "office", "customer"],
    },
  },
} as const
