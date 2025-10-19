"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { api } from "~/trpc/react";
import type { ChartDataPoint } from "~/types/chart";

type TimeRange = "7d" | "30d" | "3m";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    stroke: string;
    fill: string;
    dataKey: string;
  }>;
  label?: number;
}

export function PriceHistoryChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  // Remove unused detailedPrices query
  
  // Get historical price data for both metals
  const { data: goldHistory } = api.prices.getPriceHistory.useQuery({
    metal_type: 'gold',
    days: timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90,
  });
  
  const { data: silverHistory } = api.prices.getPriceHistory.useQuery({
    metal_type: 'silver',
    days: timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
    });
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload?.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-white mb-2">{label ? formatDate(String(label)) : ''}</p>
          {payload.map((entry, index) => (
            <div key={`price-${index}`} className="flex items-center gap-2">
              <div 
                className={`w-3 h-3 rounded-full ${entry.dataKey === 'gold' ? 'bg-amber-500' : 'bg-gray-400'}`}
              />
              <p className="text-sm text-gray-300">
                {entry.dataKey.charAt(0).toUpperCase() + entry.dataKey.slice(1)}: 
                <span className={`ml-1 font-medium ${entry.dataKey === 'gold' ? 'text-amber-500' : 'text-gray-400'}`}>
                  {formatCurrency(entry.value)}
                </span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Transform price history data for the chart
  const data: ChartDataPoint[] = (() => {
    if (!goldHistory || !silverHistory || !Array.isArray(goldHistory) || !Array.isArray(silverHistory)) return [];
    
    // Get all unique dates from both datasets
    const allDates = new Set<string>();
    
    goldHistory.forEach((h: unknown) => {
      if (h && typeof h === 'object' && 'recorded_date' in h && typeof (h as { recorded_date: unknown }).recorded_date === 'string') {
        allDates.add((h as { recorded_date: string }).recorded_date);
      }
    });
    
    silverHistory.forEach((h: unknown) => {
      if (h && typeof h === 'object' && 'recorded_date' in h && typeof (h as { recorded_date: unknown }).recorded_date === 'string') {
        allDates.add((h as { recorded_date: string }).recorded_date);
      }
    });
    
    // Create chart data points
    return Array.from(allDates)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => {
        const goldItem = goldHistory.find((h: unknown) => h && typeof h === 'object' && 'recorded_date' in h && (h as { recorded_date: unknown }).recorded_date === date && 'price_aud' in h);
        const silverItem = silverHistory.find((h: unknown) => h && typeof h === 'object' && 'recorded_date' in h && (h as { recorded_date: unknown }).recorded_date === date && 'price_aud' in h);
        const goldPrice = goldItem ? (goldItem as { price_aud: number }).price_aud : 0;
        const silverPrice = silverItem ? (silverItem as { price_aud: number }).price_aud : 0;
        
        return {
          recorded_date: date,
          timestamp: new Date(date).getTime() / 1000,
          gold: typeof goldPrice === 'number' ? goldPrice : 0,
          silver: typeof silverPrice === 'number' ? silverPrice : 0,
        };
      });
  })();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Price History</CardTitle>
            <CardDescription>Gold and silver spot prices</CardDescription>
          </div>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value as TimeRange)}
            className="bg-muted rounded-md p-1"
          >
            <ToggleGroupItem value="7d" className="text-xs">7D</ToggleGroupItem>
            <ToggleGroupItem value="30d" className="text-xs">30D</ToggleGroupItem>
            <ToggleGroupItem value="3m" className="text-xs">3M</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis
                dataKey="recorded_date"
                tickFormatter={formatDate}
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickFormatter={formatCurrency}
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['dataMin - 100', 'dataMax + 100']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="silver"
                stroke="#6b7280"
                strokeWidth={2}
                fill="url(#silverGradient)"
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 4, stroke: '#6b7280', strokeWidth: 2, fill: '#1f2937' }}
              />
              <Area
                type="monotone"
                dataKey="gold"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#goldGradient)"
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2, fill: '#1f2937' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Gold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Silver</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}