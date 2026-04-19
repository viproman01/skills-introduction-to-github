export type ShopSummary = {
  id: string;
  name: string;
  row_number: string | null;
  place_number: string | null;
  photos: string[];
  is_verified: boolean;
  sector: { code: string; floor: number; zone: { name: string; slug: string } } | null;
};

export type ShopGeo = {
  id: string;
  name: string;
  lon: number;
  lat: number;
  photo: string | null;
};

export type ProductCardData = {
  id: string;
  title: string;
  price_kzt: number;
  condition: 'new' | 'used';
  photo: string | null;
  shop: { id: string; name: string } | null;
};
