"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "~/lib/supabase-client";
import { api } from "~/trpc/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { Holding, PriceCache } from "~/types/holdings";
import type { DetailedPrices } from "~/types/prices";
import type { User } from "@supabase/supabase-js";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { Sidebar } from "~/components/layout/sidebar";

const holdingSchema = z.object({
  metal_type: z.enum(["gold", "silver"]),
  weight_oz: z.number().positive("Weight must be greater than 0"),
  form_type: z.enum(["bar", "coin"]),
  denomination: z.string().min(1, "Please select a denomination"),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
  purchase_price_aud: z.number().positive("Purchase price must be greater than 0").optional(),
  purchase_date: z.string().optional(),
  notes: z.string().optional(),
});

type HoldingForm = z.infer<typeof holdingSchema>;

export default function HoldingsPage() {
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const router = useRouter();

  // tRPC queries
  const { data: holdings = [], refetch: refetchHoldings } = api.holdings.getAll.useQuery() as { data: Holding[], refetch: () => Promise<unknown> };
  const { data: prices = [] } = api.prices.getCurrentPrices.useQuery() as { data: PriceCache[] };
  const { data: detailedPrices } = api.prices.getDetailedPrices.useQuery() as { data: DetailedPrices | undefined };

  // tRPC mutations
  const createHolding = api.holdings.create.useMutation({
    onSuccess: () => {
      void refetchHoldings();
      setIsAddDialogOpen(false);
    },
  });

  const updateHolding = api.holdings.update.useMutation({
    onSuccess: () => {
      void refetchHoldings();
      setEditingHolding(null);
    },
  });

  const deleteHolding = api.holdings.delete.useMutation({
    onSuccess: () => {
      void refetchHoldings();
    },
  });

  const form = useForm<HoldingForm>({
    mode: "onBlur",
    resolver: zodResolver(holdingSchema) as unknown as Resolver<HoldingForm>,
    defaultValues: {
      metal_type: "gold",
      weight_oz: 1,
      form_type: "coin",
      denomination: "1oz",
      quantity: 1,
      purchase_price_aud: undefined,
      purchase_date: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    const getUser = async (): Promise<void> => {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session): Promise<void> => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push("/sign-in");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const onSubmit = async (data: HoldingForm): Promise<void> => {
    if (editingHolding) {
      updateHolding.mutate({
        id: editingHolding.id,
        ...data,
      });
    } else {
      createHolding.mutate(data);
    }
  };

  const handleEdit = (holding: Holding) => {
    setEditingHolding(holding);
    form.reset({
      metal_type: holding.metal_type,
      weight_oz: holding.weight_oz,
      form_type: holding.form_type,
      denomination: holding.denomination,
      quantity: holding.quantity,
      purchase_price_aud: holding.purchase_price_aud,
      purchase_date: holding.purchase_date,
      notes: holding.notes ?? "",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this holding?")) {
      deleteHolding.mutate({ id });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const getCurrentValue = (holding: Holding) => {
    const currentPrice = prices.find(p => p.metal_type === holding.metal_type)?.price_aud ?? 0;
    const totalOz = holding.weight_oz * holding.quantity;
    return totalOz * currentPrice;
  };

  const getProfitLoss = (holding: Holding) => {
    if (!holding.purchase_price_aud) return null;
    const currentValue = getCurrentValue(holding);
    const totalPurchasePrice = holding.purchase_price_aud * holding.quantity;
    return currentValue - totalPurchasePrice;
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

  const holdingsContent = (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Holdings Management</h1>
            <p className="text-muted-foreground">
              Manage your gold and silver portfolio
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingHolding(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Holding
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingHolding ? "Edit Holding" : "Add New Holding"}
                </DialogTitle>
                <DialogDescription>
                  {editingHolding ? "Update your holding details" : "Add a new precious metal to your portfolio"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="metal_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Metal Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gold">Gold</SelectItem>
                              <SelectItem value="silver">Silver</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="form_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Form</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="coin">Coin</SelectItem>
                              <SelectItem value="bar">Bar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight_oz"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (oz)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="denomination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Denomination</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 1oz, 2oz, 5oz, 10oz" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="purchase_price_aud"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Price (AUD)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="purchase_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Additional notes..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createHolding.isPending || updateHolding.isPending}>
                      {createHolding.isPending || updateHolding.isPending
                        ? "Saving..."
                        : editingHolding
                        ? "Update"
                        : "Add Holding"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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
                <div className="text-2xl font-bold">
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
                <div className="text-2xl font-bold">
                  {formatCurrency(detailedPrices.silver.price)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date(detailedPrices.silver.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Holdings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Holdings</CardTitle>
            <CardDescription>
              {holdings.length} items in your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {holdings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metal</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Denomination</TableHead>
                    <TableHead>Weight (oz)</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Oz</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((holding) => {
                    const currentValue = getCurrentValue(holding);
                    const profitLoss = getProfitLoss(holding);
                    const totalOz = holding.weight_oz * holding.quantity;

                    return (
                      <TableRow key={holding.id}>
                        <TableCell>
                          <Badge variant={holding.metal_type === 'gold' ? 'default' : 'secondary'}>
                            {holding.metal_type.charAt(0).toUpperCase() + holding.metal_type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{holding.form_type.charAt(0).toUpperCase() + holding.form_type.slice(1)}</TableCell>
                        <TableCell>{holding.denomination}</TableCell>
                        <TableCell>{holding.weight_oz}</TableCell>
                        <TableCell>{holding.quantity}</TableCell>
                        <TableCell>{totalOz.toFixed(2)}</TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(currentValue)}
                        </TableCell>
                        <TableCell>
                          {profitLoss !== null ? (
                            <div className={`font-mono ${
                              profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                              {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(holding)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(holding.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No holdings yet. Start building your portfolio!
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Holding
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );

  return (
    <Sidebar>
      {holdingsContent}
    </Sidebar>
  );
}
