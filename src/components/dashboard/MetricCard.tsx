import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  change?: number;
  isLoading?: boolean;
}

export function MetricCard({ title, value, subtitle, icon: Icon, change, isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded mt-2" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive && <TrendingUp className="h-4 w-4 text-red-600" />}
            {isNegative && <TrendingDown className="h-4 w-4 text-green-600" />}
            {isNeutral && <Minus className="h-4 w-4 text-gray-500" />}
            <span
              className={cn(
                "text-xs font-medium",
                isPositive && "text-red-600",
                isNegative && "text-green-600",
                isNeutral && "text-gray-500"
              )}
            >
              {isPositive && "+"}
              {change.toFixed(1)}% vs last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
