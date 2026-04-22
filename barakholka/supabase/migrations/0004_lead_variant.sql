-- Stage 5: Track which product variant the buyer wanted on a lead.
--
-- Buyers pick a variant (size × color, etc.) on /product/[id]. The captured
-- variant travels with the lead so the seller can reply with stock status.

alter table order_lead
  add column variant_id uuid references product_variant(id) on delete set null;

create index order_lead_variant_idx on order_lead(variant_id);
