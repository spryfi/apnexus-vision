import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/EmptyState";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface SpendingTrendProps {
  data: { date: string; amount: number }[];
  isLoading?: boolean;
}

export function SpendingTrend({ data, isLoading }: SpendingTrendProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📈 Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📈 Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="No trend data yet"
            description="Add transactions over time to see spending trends."
          />
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: format(new Date(item.date), "MMM d"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDate" />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
              contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
