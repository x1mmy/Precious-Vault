"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "~/lib/supabase-client";
import { api } from "~/trpc/react";
import type { AuthState } from "~/types/auth";
import type { Holding, HoldingSummary } from "~/types/holdings";
import type { DetailedPrices } from "~/types/prices";
import type { HoldingsSummaryOutput } from "~/types/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Sidebar } from "~/components/layout/sidebar";
import { Badge } from "~/components/ui/badge";
import { BarChart3, PieChart } from "lucide-react";
import { PriceHistoryChart } from "~/components/charts/price-history";

export default function AnalyticsPage() {
  const [, setAuthState] = useState<AuthState>({ user: null, loading: true });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // tRPC queries
  const { data: summary } = api.holdings.getSummary.useQuery() as { data: HoldingsSummaryOutput };
  const defaultSummary: HoldingSummary = {
    totalValue: 0,
    goldValue: 0,
    silverValue: 0,
    totalGoldOz: 0,
    totalSilverOz: 0,
    goldPrice: 0,
    silverPrice: 0,
    totalHoldings: 0,
  };
  const summaryData = summary ?? defaultSummary;
  const { data: holdings = [] } = api.holdings.getAll.useQuery() as { data: Holding[] };
  const { data: detailedPrices } = api.prices.getDetailedPrices.useQuery() as { data: DetailedPrices | undefined };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          void router.push("/sign-in");
        } else {
          setAuthState({ user, loading: false });
        }
      } catch (error) {
        console.error("Error getting user:", error);
        void router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    void getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        void router.push("/sign-in");
      } else {
        setAuthState({ user: session.user, loading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '$0.00';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatOz = (oz: number | null | undefined) => {
    if (oz == null) return '0.00';
    return oz.toFixed(2);
  };

  const calculatePortfolioAllocation = () => {
    if (!summary) return { gold: 0, silver: 0 };
    
    const goldValue = summary.goldValue ?? 0;
    const silverValue = summary.silverValue ?? 0;
    const total = goldValue + silverValue;
    
    if (total === 0) return { gold: 0, silver: 0 };
    
    return {
      gold: (goldValue / total) * 100,
      silver: (silverValue / total) * 100,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const allocation = calculatePortfolioAllocation();

  const analyticsContent = (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Portfolio performance and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Portfolio Value
            </CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(summaryData.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current market value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Holdings
            </CardTitle>
            <PieChart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryData.totalHoldings}
            </div>
            <p className="text-xs text-muted-foreground">
              Items in portfolio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Price History */}
      <PriceHistoryChart />

      {/* Portfolio Allocation */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
            <CardDescription>
              Distribution between gold and silver
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-yellow-500">
                    Gold
                  </Badge>
                  <span className="font-mono">
                    {formatCurrency(summaryData.goldValue)}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {allocation.gold.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${allocation.gold}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Silver
                  </Badge>
                  <span className="font-mono">
                    {formatCurrency(summaryData.silverValue)}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {allocation.silver.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${allocation.silver}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metal Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Metal Breakdown</CardTitle>
            <CardDescription>
              Total ounces by metal type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-yellow-500">
                  Gold
                </Badge>
                <div>
                  <p className="font-medium">Total Gold</p>
                  <p className="text-sm text-muted-foreground">
                    {summaryData.totalGoldOz} oz
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-medium">
                  {formatCurrency(summaryData.goldValue)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(Number(summaryData.goldPrice))}/oz
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  Silver
                </Badge>
                <div>
                  <p className="font-medium">Total Silver</p>
                  <p className="text-sm text-muted-foreground">
                    {summaryData.totalSilverOz} oz
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-medium">
                  {formatCurrency(summaryData.silverValue)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(Number(summaryData.silverPrice))}/oz
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      {holdings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Individual holding performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holdings.map((holding) => {
                const currentPrice = holding.metal_type === 'gold' ? detailedPrices?.gold.price ?? 0 : detailedPrices?.silver.price ?? 0;
                const currentValue = (holding.weight_oz * holding.quantity) * currentPrice;
                const investedValue = holding.purchase_price_aud ? holding.purchase_price_aud * holding.quantity : 0;
                const profitLoss = currentValue - investedValue;
                const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

                return (
                  <div key={holding.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={holding.metal_type === 'gold' ? 'default' : 'secondary'}>
                        {holding.metal_type.charAt(0).toUpperCase() + holding.metal_type.slice(1)}
                      </Badge>
                      <div>
                        <p className="font-medium">
                          {holding.quantity}x {holding.denomination} {holding.form_type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatOz(holding.weight_oz * holding.quantity)} oz total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium">
                        {formatCurrency(currentValue)}
                      </p>
                      {investedValue > 0 && (
                        <p className={`text-sm font-mono ${
                          profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)} ({profitLossPercent.toFixed(1)}%)
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {holdings?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No holdings to analyze. Add some holdings to see your portfolio analytics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Sidebar>
      {analyticsContent}
    </Sidebar>
  );
}