"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "~/lib/supabase";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Sidebar } from "~/components/layout/sidebar";
import { Coins, Plus } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // tRPC queries
  const { data: summary } = api.holdings.getSummary.useQuery();
  const { data: holdings } = api.holdings.getAll.useQuery();
  const { data: detailedPrices } = api.prices.getDetailedPrices.useQuery();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push("/sign-in");
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    void getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push("/sign-in");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatOz = (oz: number) => {
    return oz.toFixed(2);
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

  const dashboardContent = (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/holdings">
              <Coins className="w-4 h-4 mr-2" />
              Manage Holdings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/holdings">
              <Plus className="w-4 h-4 mr-2" />
              Add Holding
            </Link>
          </Button>
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(summary?.totalValue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined gold & silver value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gold Holdings
            </CardTitle>
            <Badge variant="default" className="bg-yellow-500">
              Gold
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatOz(summary?.totalGoldOz ?? 0)} oz
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {formatCurrency(summary?.goldValue ?? 0)} AUD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Silver Holdings
            </CardTitle>
            <Badge variant="secondary">
              Silver
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatOz(summary?.totalSilverOz ?? 0)} oz
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {formatCurrency(summary?.silverValue ?? 0)} AUD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalHoldings ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Items in portfolio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Prices */}
      {detailedPrices && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                Gold Spot Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {formatCurrency(detailedPrices.gold.price)}
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(detailedPrices.gold.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                Silver Spot Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {formatCurrency(detailedPrices.silver.price)}
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(detailedPrices.silver.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Holdings</CardTitle>
          <CardDescription>
            Your latest portfolio additions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holdings && holdings.length > 0 ? (
            <div className="space-y-4">
              {holdings.slice(0, 5).map((holding: { id: string; metal_type: string; weight_oz: number; quantity: number; denomination: string; form_type: string }) => {
                const currentPrice = holding.metal_type === 'gold' 
                  ? (detailedPrices?.gold.price ?? 0)
                  : (detailedPrices?.silver.price ?? 0);
                const currentValue = (holding.weight_oz * holding.quantity) * currentPrice;
                
                return (
                  <div key={holding.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={holding.metal_type === 'gold' ? 'default' : 'secondary'}>
                        {String(holding.metal_type).charAt(0).toUpperCase() + String(holding.metal_type).slice(1)}
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
                      <p className="text-sm text-muted-foreground">
                        {formatOz(holding.weight_oz)} oz each
                      </p>
                    </div>
                  </div>
                );
              })}
              {holdings.length > 5 && (
                <div className="text-center pt-4">
                  <Button asChild variant="outline">
                    <Link href="/holdings">
                      View All Holdings ({holdings.length})
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No holdings yet. Start building your portfolio!</p>
              <Button asChild>
                <Link href="/holdings">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Holding
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Sidebar>
      {dashboardContent}
    </Sidebar>
  );
}