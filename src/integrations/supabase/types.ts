export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      driver_locations: {
        Row: {
          driver_user_id: string;
          heading: number | null;
          is_available: boolean;
          lat: number;
          lng: number;
          updated_at: string;
        };
        Insert: {
          driver_user_id: string;
          heading?: number | null;
          is_available?: boolean;
          lat: number;
          lng: number;
          updated_at?: string;
        };
        Update: {
          driver_user_id?: string;
          heading?: number | null;
          is_available?: boolean;
          lat?: number;
          lng?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      drivers: {
        Row: {
          created_at: string;
          id: string;
          id_document_url: string | null;
          license_number: string;
          national_id: string;
          rating: number;
          rejection_reason: string | null;
          selfie_url: string | null;
          total_rides: number;
          updated_at: string;
          user_id: string;
          vehicle_color: string | null;
          vehicle_make: string | null;
          vehicle_model: string | null;
          vehicle_plate: string | null;
          vehicle_year: number | null;
          verification_status: Database["public"]["Enums"]["driver_verification_status"];
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          id_document_url?: string | null;
          license_number: string;
          national_id: string;
          rating?: number;
          rejection_reason?: string | null;
          selfie_url?: string | null;
          total_rides?: number;
          updated_at?: string;
          user_id: string;
          vehicle_color?: string | null;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_plate?: string | null;
          vehicle_year?: number | null;
          verification_status?: Database["public"]["Enums"]["driver_verification_status"];
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          id_document_url?: string | null;
          license_number?: string;
          national_id?: string;
          rating?: number;
          rejection_reason?: string | null;
          selfie_url?: string | null;
          total_rides?: number;
          updated_at?: string;
          user_id?: string;
          vehicle_color?: string | null;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_plate?: string | null;
          vehicle_year?: number | null;
          verification_status?: Database["public"]["Enums"]["driver_verification_status"];
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          date_of_birth: string | null;
          full_name: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string;
          identity_verified: boolean;
          identity_verified_at: string | null;
          is_blacklisted: boolean;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          full_name?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id: string;
          identity_verified?: boolean;
          identity_verified_at?: string | null;
          is_blacklisted?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          full_name?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string;
          identity_verified?: boolean;
          identity_verified_at?: string | null;
          is_blacklisted?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      promo_codes: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          description: string | null;
          discount_type: string;
          expires_at: string | null;
          max_discount: number | null;
          max_redemptions: number | null;
          per_user_limit: number;
          starts_at: string;
          value: number;
        };
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          description?: string | null;
          discount_type?: string;
          expires_at?: string | null;
          max_discount?: number | null;
          max_redemptions?: number | null;
          per_user_limit?: number;
          starts_at?: string;
          value: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          description?: string | null;
          discount_type?: string;
          expires_at?: string | null;
          max_discount?: number | null;
          max_redemptions?: number | null;
          per_user_limit?: number;
          starts_at?: string;
          value?: number;
        };
        Relationships: [];
      };
      promo_redemptions: {
        Row: {
          amount: number;
          code: string;
          created_at: string;
          id: string;
          ride_id: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          code: string;
          created_at?: string;
          id?: string;
          ride_id: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          code?: string;
          created_at?: string;
          id?: string;
          ride_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_code_fkey";
            columns: ["code"];
            isOneToOne: false;
            referencedRelation: "promo_codes";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "promo_redemptions_ride_id_fkey";
            columns: ["ride_id"];
            isOneToOne: true;
            referencedRelation: "rides";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_codes: {
        Row: {
          code: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      referral_signups: {
        Row: {
          created_at: string;
          credited: boolean;
          credited_at: string | null;
          referee_id: string;
          referrer_id: string;
        };
        Insert: {
          created_at?: string;
          credited?: boolean;
          credited_at?: string | null;
          referee_id: string;
          referrer_id: string;
        };
        Update: {
          created_at?: string;
          credited?: boolean;
          credited_at?: string | null;
          referee_id?: string;
          referrer_id?: string;
        };
        Relationships: [];
      };
      ride_messages: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          ride_id: string;
          sender_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          ride_id: string;
          sender_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          ride_id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ride_messages_ride_id_fkey";
            columns: ["ride_id"];
            isOneToOne: false;
            referencedRelation: "rides";
            referencedColumns: ["id"];
          },
        ];
      };
      ride_pins: {
        Row: {
          created_at: string;
          failed_attempts: number;
          pin: string;
          ride_id: string;
        };
        Insert: {
          created_at?: string;
          failed_attempts?: number;
          pin: string;
          ride_id: string;
        };
        Update: {
          created_at?: string;
          failed_attempts?: number;
          pin?: string;
          ride_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ride_pins_ride_id_fkey";
            columns: ["ride_id"];
            isOneToOne: true;
            referencedRelation: "rides";
            referencedColumns: ["id"];
          },
        ];
      };
      ride_ratings: {
        Row: {
          comment: string | null;
          compliments: string[];
          created_at: string;
          id: string;
          ratee_id: string;
          rater_id: string;
          rating: number;
          ride_id: string;
          tip_amount: number;
        };
        Insert: {
          comment?: string | null;
          compliments?: string[];
          created_at?: string;
          id?: string;
          ratee_id: string;
          rater_id: string;
          rating: number;
          ride_id: string;
          tip_amount?: number;
        };
        Update: {
          comment?: string | null;
          compliments?: string[];
          created_at?: string;
          id?: string;
          ratee_id?: string;
          rater_id?: string;
          rating?: number;
          ride_id?: string;
          tip_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ride_ratings_ride_id_fkey";
            columns: ["ride_id"];
            isOneToOne: false;
            referencedRelation: "rides";
            referencedColumns: ["id"];
          },
        ];
      };
      rides: {
        Row: {
          accepted_at: string | null;
          arrived_at: string | null;
          cancellation_fee: number | null;
          cancellation_reason: string | null;
          category_multiplier: number | null;
          completed_at: string | null;
          created_at: string;
          distance_km: number | null;
          driver_id: string | null;
          drop_address: string | null;
          discount: number;
          drop_lat: number;
          drop_lng: number;
          duration_min: number | null;
          fare_estimate: number | null;
          fare_final: number | null;
          id: string;
          passenger_id: string;
          pickup_address: string | null;
          pickup_lat: number;
          pickup_lng: number;
          promo_code: string | null;
          requested_at: string;
          scheduled_for: string | null;
          started_at: string | null;
          surge_amount: number | null;
          surge_multiplier: number;
          status: Database["public"]["Enums"]["ride_status"];
          updated_at: string;
          waiting_fee: number | null;
          waiting_minutes: number | null;
          waypoints: Json;
        };
        Insert: {
          accepted_at?: string | null;
          arrived_at?: string | null;
          cancellation_fee?: number | null;
          cancellation_reason?: string | null;
          category_multiplier?: number | null;
          completed_at?: string | null;
          created_at?: string;
          distance_km?: number | null;
          driver_id?: string | null;
          drop_address?: string | null;
          discount?: number;
          drop_lat: number;
          drop_lng: number;
          duration_min?: number | null;
          fare_estimate?: number | null;
          fare_final?: number | null;
          id?: string;
          passenger_id: string;
          pickup_address?: string | null;
          pickup_lat: number;
          pickup_lng: number;
          promo_code?: string | null;
          requested_at?: string;
          scheduled_for?: string | null;
          started_at?: string | null;
          surge_amount?: number | null;
          surge_multiplier?: number;
          status?: Database["public"]["Enums"]["ride_status"];
          updated_at?: string;
          waiting_fee?: number | null;
          waiting_minutes?: number | null;
          waypoints?: Json;
        };
        Update: {
          accepted_at?: string | null;
          arrived_at?: string | null;
          cancellation_fee?: number | null;
          cancellation_reason?: string | null;
          category_multiplier?: number | null;
          completed_at?: string | null;
          created_at?: string;
          distance_km?: number | null;
          driver_id?: string | null;
          drop_address?: string | null;
          discount?: number;
          drop_lat?: number;
          drop_lng?: number;
          duration_min?: number | null;
          fare_estimate?: number | null;
          fare_final?: number | null;
          id?: string;
          passenger_id?: string;
          pickup_address?: string | null;
          pickup_lat?: number;
          pickup_lng?: number;
          promo_code?: string | null;
          requested_at?: string;
          scheduled_for?: string | null;
          started_at?: string | null;
          surge_amount?: number | null;
          surge_multiplier?: number;
          status?: Database["public"]["Enums"]["ride_status"];
          updated_at?: string;
          waiting_fee?: number | null;
          waiting_minutes?: number | null;
          waypoints?: Json;
        };
        Relationships: [];
      };
      pricing_config: {
        Row: {
          base_fare: number;
          booking_fee: number;
          commission_rate: number;
          currency: string;
          id: string;
          max_fare: number;
          min_fare: number;
          per_km: number;
          per_min: number;
          referral_reward: number;
          rounding: number;
          updated_at: string;
        };
        Insert: {
          base_fare?: number;
          booking_fee?: number;
          commission_rate?: number;
          currency?: string;
          id?: string;
          max_fare?: number;
          min_fare?: number;
          per_km?: number;
          per_min?: number;
          referral_reward?: number;
          rounding?: number;
          updated_at?: string;
        };
        Update: {
          base_fare?: number;
          booking_fee?: number;
          commission_rate?: number;
          currency?: string;
          id?: string;
          max_fare?: number;
          min_fare?: number;
          per_km?: number;
          per_min?: number;
          referral_reward?: number;
          rounding?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
          metadata?: Json;
        };
        Update: { [_ in never]: never };
        Relationships: [];
      };
      fraud_signals: {
        Row: {
          created_at: string;
          id: string;
          metadata: Json;
          resolved: boolean;
          ride_id: string | null;
          severity: string;
          signal: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          resolved?: boolean;
          ride_id?: string | null;
          severity?: string;
          signal: string;
          user_id?: string | null;
        };
        Update: { resolved?: boolean };
        Relationships: [];
      };
      pricing_quotes: {
        Row: {
          category_multiplier: number | null;
          created_at: string;
          currency: string;
          distance_km: number | null;
          duration_min: number | null;
          fare_estimate: number | null;
          id: string;
          passenger_id: string | null;
          pricing_version: string;
          ride_id: string | null;
        };
        Insert: {
          category_multiplier?: number | null;
          created_at?: string;
          currency?: string;
          distance_km?: number | null;
          duration_min?: number | null;
          fare_estimate?: number | null;
          id?: string;
          passenger_id?: string | null;
          pricing_version?: string;
          ride_id?: string | null;
        };
        Update: { [_ in never]: never };
        Relationships: [];
      };
      saved_places: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          label: string;
          lat: number;
          lng: number;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          label: string;
          lat: number;
          lng: number;
          user_id: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          label?: string;
          lat?: number;
          lng?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      sos_alerts: {
        Row: {
          created_at: string;
          id: string;
          lat: number | null;
          lng: number | null;
          notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          ride_id: string | null;
          status: Database["public"]["Enums"]["sos_status"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          ride_id?: string | null;
          status?: Database["public"]["Enums"]["sos_status"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          ride_id?: string | null;
          status?: Database["public"]["Enums"]["sos_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sos_alerts_ride_id_fkey";
            columns: ["ride_id"];
            isOneToOne: false;
            referencedRelation: "rides";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_shares: {
        Row: {
          created_at: string;
          created_by: string;
          expires_at: string;
          id: string;
          ride_id: string;
          share_token: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          expires_at?: string;
          id?: string;
          ride_id: string;
          share_token?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          expires_at?: string;
          id?: string;
          ride_id?: string;
          share_token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_shares_ride_id_fkey";
            columns: ["ride_id"];
            isOneToOne: false;
            referencedRelation: "rides";
            referencedColumns: ["id"];
          },
        ];
      };
      trusted_contacts: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          phone: string;
          relationship: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          phone: string;
          relationship?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          phone?: string;
          relationship?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: { balance: number; currency: string; updated_at: string; user_id: string };
        Insert: { balance?: number; currency?: string; updated_at?: string; user_id: string };
        Update: { balance?: number; currency?: string; updated_at?: string; user_id?: string };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          balance_after: number | null;
          created_at: string;
          description: string | null;
          id: string;
          idempotency_key: string | null;
          metadata: Json;
          reference: string | null;
          ride_id: string | null;
          status: Database["public"]["Enums"]["transaction_status"];
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
        };
        Insert: {
          amount: number;
          balance_after?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          idempotency_key?: string | null;
          metadata?: Json;
          reference?: string | null;
          ride_id?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"];
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
        };
        Update: {
          amount?: number;
          balance_after?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          idempotency_key?: string | null;
          metadata?: Json;
          reference?: string | null;
          ride_id?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"];
          type?: Database["public"]["Enums"]["transaction_type"];
          user_id?: string;
        };
        Relationships: [];
      };
      payment_intents: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          idempotency_key: string | null;
          metadata: Json;
          method: Database["public"]["Enums"]["payment_method"];
          passenger_id: string;
          provider: string | null;
          provider_ref: string | null;
          ride_id: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          id?: string;
          idempotency_key?: string | null;
          metadata?: Json;
          method: Database["public"]["Enums"]["payment_method"];
          passenger_id: string;
          provider?: string | null;
          provider_ref?: string | null;
          ride_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          currency?: string;
          metadata?: Json;
          provider?: string | null;
          provider_ref?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      payouts: {
        Row: {
          amount: number;
          destination: string | null;
          driver_user_id: string;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          processed_at: string | null;
          reference: string | null;
          requested_at: string;
          status: Database["public"]["Enums"]["payout_status"];
        };
        Insert: {
          amount: number;
          destination?: string | null;
          driver_user_id: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          processed_at?: string | null;
          reference?: string | null;
          requested_at?: string;
          status?: Database["public"]["Enums"]["payout_status"];
        };
        Update: {
          processed_at?: string | null;
          reference?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
        };
        Relationships: [];
      };
      platform_ledger: {
        Row: {
          commission: number;
          commission_rate: number;
          created_at: string;
          currency: string;
          driver_payout: number;
          gross_fare: number;
          id: string;
          ride_id: string | null;
        };
        Insert: {
          commission: number;
          commission_rate: number;
          created_at?: string;
          currency?: string;
          driver_payout: number;
          gross_fare: number;
          id?: string;
          ride_id?: string | null;
        };
        Update: {
          [_ in never]: never;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          read_at: string | null;
          ride_id: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          ride_id?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          ride_id?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_ride: {
        Args: { _ride_id: string };
        Returns: {
          accepted_at: string | null;
          cancellation_reason: string | null;
          completed_at: string | null;
          created_at: string;
          distance_km: number | null;
          driver_id: string | null;
          drop_address: string | null;
          drop_lat: number;
          drop_lng: number;
          fare_estimate: number | null;
          fare_final: number | null;
          id: string;
          passenger_id: string;
          pickup_address: string | null;
          pickup_lat: number;
          pickup_lng: number;
          requested_at: string;
          started_at: string | null;
          status: Database["public"]["Enums"]["ride_status"];
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "rides";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_female: { Args: { _user_id: string }; Returns: boolean };
      is_verified_female_driver: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      // Phase 23 — sequential dispatch + no-show.
      my_pending_offer: {
        Args: Record<string, never>;
        Returns: {
          offer_id: string;
          ride_id: string;
          distance_km: number | null;
          expires_at: string;
          pickup_address: string | null;
          drop_address: string | null;
          fare_estimate: number | null;
        }[];
      };
      accept_offer: {
        Args: { _offer_id: string };
        Returns: Database["public"]["Tables"]["rides"]["Row"];
      };
      decline_offer: {
        Args: { _offer_id: string };
        Returns: undefined;
      };
      report_no_show: {
        Args: { _ride_id: string };
        Returns: Database["public"]["Tables"]["rides"]["Row"];
      };
      offer_next_driver: {
        Args: { _ride_id: string };
        Returns: unknown;
      };
      // Phase 22 — admin second factor.
      session_has_mfa: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      // Phase 21 — data rights (Kenya DPA 2019).
      delete_my_account: {
        Args: { _reason?: string };
        Returns: undefined;
      };
      enforce_retention: {
        Args: Record<string, never>;
        Returns: { what: string; removed: number }[];
      };
      // Phase 28 — SOS escalation and driver-identity-at-pickup.
      get_public_driver: {
        Args: { _driver_user_id: string };
        Returns: {
          user_id: string;
          name: string | null;
          rating: number | null;
          vehicle: string | null;
          plate: string | null;
          color: string | null;
          photo_path: string | null;
        }[];
      };
      my_emergency_contacts: {
        Args: Record<string, never>;
        Returns: {
          name: string;
          phone: string;
          is_app_user: boolean;
          emergency_number: string;
        }[];
      };
      pending_sos_escalations: {
        Args: { _limit?: number };
        Returns: {
          id: string;
          target_phone: string | null;
          body: string | null;
          attempts: number;
        }[];
      };
      mark_escalation: {
        Args: { _id: string; _ok: boolean; _error?: string };
        Returns: undefined;
      };
      // Phase 26 — surge pricing.
      surge_at: {
        Args: { _lat: number; _lng: number };
        Returns: number;
      };
      current_surge: {
        Args: { _lat: number; _lng: number };
        Returns: number;
      };
      km_between: {
        Args: { _lat1: number; _lng1: number; _lat2: number; _lng2: number };
        Returns: number;
      };
      // Phase 25 — rider identity verification.
      my_rider_verification: {
        Args: Record<string, never>;
        Returns: {
          is_verified: boolean;
          status: string;
          reject_reason: string | null;
          submitted_at: string | null;
          required: boolean;
          rides_remaining: number;
        }[];
      };
      submit_rider_verification: {
        Args: { _selfie_url: string; _id_document_url: string; _id_number?: string };
        Returns: unknown;
      };
      list_pending_rider_verifications: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          user_id: string;
          full_name: string | null;
          phone: string | null;
          gender: string | null;
          selfie_url: string;
          id_document_url: string;
          id_number: string | null;
          submitted_at: string;
        }[];
      };
      review_rider_verification: {
        Args: { _verification_id: string; _approve: boolean; _reason?: string };
        Returns: unknown;
      };
      rider_may_book: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      // Phase 19 — periodic driver identity re-check.
      my_driver_check_state: {
        Args: Record<string, never>;
        Returns: {
          is_current: boolean;
          last_checked_at: string | null;
          due_at: string | null;
          pending_review: boolean;
        }[];
      };
      submit_driver_check: {
        Args: { _selfie_url: string };
        Returns: unknown;
      };
      review_driver_check: {
        Args: { _check_id: string; _passed: boolean; _reason?: string };
        Returns: unknown;
      };
      list_pending_driver_checks: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          driver_user_id: string;
          full_name: string | null;
          selfie_url: string;
          verification_selfie_url: string | null;
          submitted_at: string;
          last_checked_at: string | null;
        }[];
      };
      driver_check_is_current: {
        Args: { _driver_user_id: string };
        Returns: boolean;
      };
      // Phase 18 — hand-added alongside the SQL, per CLAUDE.md rule 6.
      ping_driver_location: {
        Args: { _lat: number; _lng: number; _heading?: number };
        Returns: undefined;
      };
      set_driver_availability: {
        Args: { _available: boolean; _lat?: number; _lng?: number };
        Returns: undefined;
      };
      cancel_ride: {
        Args: { _ride_id: string; _reason?: string };
        Returns: Database["public"]["Tables"]["rides"]["Row"];
      };
      nearest_available_drivers: {
        Args: {
          _lat: number;
          _limit?: number;
          _lng: number;
          _radius_km?: number;
        };
        Returns: {
          distance_km: number;
          driver_user_id: string;
          lat: number;
          lng: number;
          rating: number;
          vehicle_make: string;
          vehicle_model: string;
          vehicle_plate: string;
        }[];
      };
      complete_ride: {
        Args: { _ride_id: string; _commission?: number };
        Returns: Database["public"]["Tables"]["rides"]["Row"];
      };
      quote_fare: {
        Args: { _distance_km: number; _duration_min: number; _category_multiplier?: number };
        Returns: number;
      };
      submit_rating: {
        Args: {
          _ride_id: string;
          _stars: number;
          _comment?: string;
          _compliments?: string[];
          _tip?: number;
        };
        Returns: Database["public"]["Tables"]["ride_ratings"]["Row"];
      };
      has_rated: {
        Args: { _ride_id: string };
        Returns: boolean;
      };
      validate_promo: {
        Args: { _code: string; _subtotal: number };
        Returns: {
          code: string;
          label: string;
          discount: number;
        }[];
      };
      apply_promo: {
        Args: { _ride_id: string; _code: string };
        Returns: number;
      };
      get_referral_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      redeem_referral: {
        Args: { _code: string };
        Returns: undefined;
      };
      apply_as_driver: {
        Args: {
          _license_number: string;
          _national_id: string;
          _vehicle_make: string;
          _vehicle_model: string;
          _vehicle_plate: string;
          _vehicle_color?: string;
          _vehicle_year?: number;
          _selfie_url?: string;
          _id_document_url?: string;
        };
        Returns: Database["public"]["Tables"]["drivers"]["Row"];
      };
      get_my_driver_application: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Tables"]["drivers"]["Row"];
      };
      set_driver_status: {
        Args: {
          _driver_user_id: string;
          _status: Database["public"]["Enums"]["driver_verification_status"];
          _reason?: string;
        };
        Returns: Database["public"]["Tables"]["drivers"]["Row"];
      };
      admin_overview: {
        Args: Record<PropertyKey, never>;
        Returns: {
          pending_drivers: number;
          verified_drivers: number;
          suspended_drivers: number;
          drivers_online: number;
          active_rides: number;
          rides_today: number;
          completed_today: number;
          cancelled_today: number;
          gross_today: number;
          commission_today: number;
          open_sos: number;
          open_fraud_signals: number;
          passengers_total: number;
          currency: string;
        }[];
      };
      driver_earnings: {
        Args: Record<PropertyKey, never>;
        Returns: {
          today: number;
          week: number;
          lifetime: number;
          trips_today: number;
          trips_week: number;
          trips_lifetime: number;
          tips_week: number;
          commission_week: number;
          currency: string;
        }[];
      };
      start_trip_with_pin: {
        Args: { _ride_id: string; _pin: string };
        Returns: Database["public"]["Tables"]["rides"]["Row"];
      };
      list_driver_applications: {
        Args: { _status?: Database["public"]["Enums"]["driver_verification_status"] };
        Returns: {
          user_id: string;
          full_name: string | null;
          phone: string | null;
          license_number: string;
          national_id: string;
          vehicle_make: string | null;
          vehicle_model: string | null;
          vehicle_plate: string | null;
          vehicle_color: string | null;
          vehicle_year: number | null;
          selfie_url: string | null;
          id_document_url: string | null;
          verification_status: Database["public"]["Enums"]["driver_verification_status"];
          rejection_reason: string | null;
          applied_at: string;
        }[];
      };
      get_receipt: {
        Args: { _ride_id: string };
        Returns: {
          ride_id: string;
          status: string;
          currency: string;
          base_fare: number;
          distance_cost: number;
          time_cost: number;
          booking_fee: number;
          surge_multiplier: number;
          surge_amount: number;
          adjustment: number;
          discount: number;
          promo_code: string | null;
          waiting_minutes: number;
          waiting_fee: number;
          cancellation_fee: number;
          total: number;
          tip: number;
          commission: number;
          driver_earnings: number;
          distance_km: number | null;
          duration_min: number | null;
          driver_name: string | null;
          vehicle: string | null;
          plate: string | null;
          pickup_address: string | null;
          drop_address: string | null;
          requested_at: string;
          completed_at: string | null;
        }[];
      };
      financial_report: {
        Args: { _bucket?: string; _since?: string };
        Returns: {
          period: string;
          gross_revenue: number;
          commission_revenue: number;
          driver_earnings: number;
          rides: number;
        }[];
      };
      get_top_drivers: {
        Args: { _since?: string; _limit?: number };
        Returns: { driver_id: string; name: string | null; rides: number; earnings: number }[];
      };
      get_top_customers: {
        Args: { _since?: string; _limit?: number };
        Returns: { passenger_id: string; name: string | null; rides: number; spend: number }[];
      };
      get_top_routes: {
        Args: { _since?: string; _limit?: number };
        Returns: { pickup: string; dropoff: string; rides: number; revenue: number }[];
      };
      list_audit_log: {
        Args: { _limit?: number };
        Returns: Database["public"]["Tables"]["audit_log"]["Row"][];
      };
      wallet_topup: {
        Args: { _amount: number };
        Returns: Database["public"]["Tables"]["wallets"]["Row"];
      };
      request_payout: {
        Args: {
          _amount: number;
          _method?: Database["public"]["Enums"]["payment_method"];
          _destination?: string;
        };
        Returns: Database["public"]["Tables"]["payouts"]["Row"];
      };
      refund_ride: {
        Args: { _ride_id: string; _amount: number; _reason?: string };
        Returns: Database["public"]["Tables"]["transactions"]["Row"];
      };
      get_financial_summary: {
        Args: { _since?: string };
        Returns: {
          gross_revenue: number;
          commission_revenue: number;
          driver_earnings: number;
          refunds: number;
          payouts_paid: number;
          payouts_pending: number;
          completed_rides: number;
          average_fare: number;
        }[];
      };
      raise_sos: {
        Args: { _ride_id: string; _lat?: number; _lng?: number; _notes?: string };
        Returns: Database["public"]["Tables"]["sos_alerts"]["Row"];
      };
      get_shared_trip: {
        Args: { _token: string };
        Returns: {
          status: Database["public"]["Enums"]["ride_status"];
          pickup_address: string | null;
          drop_address: string | null;
          has_driver: boolean;
          expires_at: string;
        }[];
      };
    };
    Enums: {
      app_role: "passenger" | "driver" | "admin";
      driver_verification_status: "pending" | "verified" | "rejected" | "suspended";
      gender: "female" | "male" | "other";
      ride_status:
        | "requested"
        | "matched"
        | "accepted"
        | "arrived"
        | "in_progress"
        | "completed"
        | "cancelled";
      sos_status: "active" | "acknowledged" | "resolved" | "false_alarm";
      transaction_type:
        | "ride_payment"
        | "ride_payout"
        | "topup"
        | "refund"
        | "commission"
        | "withdrawal"
        | "adjustment";
      transaction_status: "pending" | "completed" | "failed";
      payment_method: "cash" | "mpesa" | "card" | "wallet";
      payment_status:
        | "requires_payment"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
        | "cancelled";
      payout_status: "pending" | "processing" | "paid" | "failed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["passenger", "driver", "admin"],
      driver_verification_status: ["pending", "verified", "rejected", "suspended"],
      gender: ["female", "male", "other"],
      ride_status: [
        "requested",
        "matched",
        "accepted",
        "arrived",
        "in_progress",
        "completed",
        "cancelled",
      ],
      sos_status: ["active", "acknowledged", "resolved", "false_alarm"],
    },
  },
} as const;
