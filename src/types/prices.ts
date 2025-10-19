export interface DetailedPrices {
  gold: {
    price: number;
    timestamp: string;
  };
  silver: {
    price: number;
    timestamp: string;
  };
}

export interface PriceHistory {
  id: string;
  metal_type: 'gold' | 'silver';
  price_aud: number;
  recorded_date: string;
  created_at: string;
}
