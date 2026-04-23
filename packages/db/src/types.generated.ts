// Regenerate with:  pnpm db:types
// Placeholder until `supabase gen types typescript` runs against your project.
// Shape mirrors @supabase/supabase-js expectations so .insert / .update / .select
// don't narrow to `never`.

/* eslint-disable @typescript-eslint/no-explicit-any */
type LooseRow = Record<string, any>;
type LooseTable = {
  Row: LooseRow;
  Insert: LooseRow;
  Update: LooseRow;
  Relationships: unknown[];
};

export type Database = {
  public: {
    Tables: {
      market: LooseTable;
      zone: LooseTable;
      sector: LooseTable;
      seller: LooseTable;
      shop: LooseTable;
      category: LooseTable;
      product: LooseTable;
      product_media: LooseTable;
      product_variant: LooseTable;
      order_lead: LooseTable;
      review: LooseTable;
      favorite: LooseTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      product_condition: 'new' | 'used';
      media_type: 'photo' | 'video';
      lead_channel: 'whatsapp' | 'telegram' | 'phone' | 'kaspi';
      lead_status: 'new' | 'contacted' | 'done' | 'cancelled';
    };
    CompositeTypes: Record<string, never>;
  };
};
