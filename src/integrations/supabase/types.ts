export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Hand-written, and deliberately minimal: the site touches exactly one table.
 * See `scripts/project-briefs.sql` for the schema and its policies.
 */
export type Database = {
  public: {
    Tables: {
      project_briefs: {
        Row: {
          budget: string | null;
          company: string | null;
          created_at: string;
          details: string;
          email: string;
          id: string;
          name: string;
          need: string;
          status: string;
        };
        Insert: {
          budget?: string | null;
          company?: string | null;
          created_at?: string;
          details: string;
          email: string;
          id?: string;
          name: string;
          need: string;
          status?: string;
        };
        Update: {
          budget?: string | null;
          company?: string | null;
          created_at?: string;
          details?: string;
          email?: string;
          id?: string;
          name?: string;
          need?: string;
          status?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
