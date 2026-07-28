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
          is_blacklisted?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ride_ratings: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          ratee_id: string;
          rater_id: string;
          rating: number;
          ride_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          ratee_id: string;
          rater_id: string;
          rating: number;
          ride_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          ratee_id?: string;
          rater_id?: string;
          rating?: number;
          ride_id?: string;
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
          cancellation_reason: string | null;
          category_multiplier: number | null;
          completed_at: string | null;
          created_at: string;
          distance_km: number | null;
          driver_id: string | null;
          drop_address: string | null;
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
          requested_at: string;
          started_at: string | null;
          status: Database["public"]["Enums"]["ride_status"];
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          cancellation_reason?: string | null;
          category_multiplier?: number | null;
          completed_at?: string | null;
          created_at?: string;
          distance_km?: number | null;
          driver_id?: string | null;
          drop_address?: string | null;
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
          requested_at?: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["ride_status"];
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          cancellation_reason?: string | null;
          category_multiplier?: number | null;
          completed_at?: string | null;
          created_at?: string;
          distance_km?: number | null;
          driver_id?: string | null;
          drop_address?: string | null;
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
          requested_at?: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["ride_status"];
          updated_at?: string;
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
          rounding?: number;
          updated_at?: string;
        };
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
