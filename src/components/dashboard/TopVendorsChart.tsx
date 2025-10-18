import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/EmptyState";
import { Building2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopVendorsChartProps {
  data: { name: string; total: number }[];
  isLoading?: boolean;
}

export function TopVendorsChart({ data, isLoading }: TopVendorsChartProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Top 10 Vendors by Spending</CardTitle>
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
          <CardTitle>📊 Top 10 Vendors by Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Building2}
            title="No vendor data yet"
            description="Start adding transactions with vendors to see spending analytics."
            actionLabel="View Transactions"
            onAction={() => navigate("/transactions")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>📊 Top 10 Vendors by Spending</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/vendors")}>
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <YAxis dataKey="name" type="category" width={90} />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
              contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
