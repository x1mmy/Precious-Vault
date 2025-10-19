export interface Holding {
  id: string;
  user_id: string;
  metal_type: 'gold' | 'silver';
  weight_oz: number;
  form_type: 'bar' | 'coin';
  denomination: string;
  quantity: number;
  purchase_price_aud?: number;
  purchase_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HoldingSummary {
  totalValue: number;
  goldValue: number;
  silverValue: number;
  totalGoldOz: number;
  totalSilverOz: number;
  goldPrice: number;
  silverPrice: number;
  totalHoldings: number;
}

export interface PriceCache {
  id: string;
  metal_type: 'gold' | 'silver';
  price_aud: number;
  updated_at: string;
}