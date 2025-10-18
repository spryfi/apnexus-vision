import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { EmptyState } from "@/components/EmptyState";
import { Tag, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CategoryBreakdownProps {
  data: { name: string; total: number; percentage: string }[];
  isLoading?: boolean;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function CategoryBreakdown({ data, isLoading }: CategoryBreakdownProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎯 Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎯 Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Tag}
            title="No category data yet"
            description="Categorize your transactions to see spending breakdown by category."
            actionLabel="View Categories"
            onAction={() => navigate("/categories")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>🎯 Spending by Category</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/categories")}>
          View Details <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="total"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 font-semibold text-sm border-b pb-2">
              <span>Category</span>
              <span className="text-right">Amount</span>
              <span className="text-right">%</span>
            </div>
            {data.map((category, index) => (
              <div key={category.name} className="grid grid-cols-3 gap-2 text-sm items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate">{category.name}</span>
                </div>
                <span className="text-right font-medium">${category.total.toLocaleString()}</span>
                <span className="text-right text-muted-foreground">{category.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
