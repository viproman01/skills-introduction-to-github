// Regenerate with:  pnpm db:types
// Placeholder until supabase gen types runs against your project.
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: {
      product_condition: 'new' | 'used';
      media_type: 'photo' | 'video';
      lead_channel: 'whatsapp' | 'telegram' | 'phone' | 'kaspi';
      lead_status: 'new' | 'contacted' | 'done' | 'cancelled';
    };
  };
};
