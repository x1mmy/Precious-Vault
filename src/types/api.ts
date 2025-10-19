export interface MetalsDevResponse {
  status: string;
  currency: string;
  unit: string;
  metals: {
    gold: number;
    silver: number;
    platinum: number;
    palladium: number;
    lbma_gold_am: number;
    lbma_gold_pm: number;
    lbma_silver: number;
    lbma_platinum_am: number;
    lbma_platinum_pm: number;
    lbma_palladium_am: number;
    lbma_palladium_pm: number;
    mcx_gold: number;
    mcx_gold_am: number;
    mcx_gold_pm: number;
    mcx_silver: number;
    mcx_silver_am: number;
    mcx_silver_pm: number;
    ibja_gold: number;
    copper: number;
    aluminum: number;
    lead: number;
    nickel: number;
    zinc: number;
    lme_copper: number;
    lme_aluminum: number;
    lme_lead: number;
    lme_nickel: number;
    lme_zinc: number;
  };
  currencies: Record<string, number>;
  timestamps: {
    metal: string;
    currency: string;
  };
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}
