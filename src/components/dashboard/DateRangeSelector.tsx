import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRangeOption, DateRange } from "@/hooks/useDashboardData";

interface DateRangeSelectorProps {
  value: DateRangeOption;
  onChange: (option: DateRangeOption) => void;
  customRange?: DateRange;
  onCustomRangeChange?: (range: DateRange) => void;
}

export function DateRangeSelector({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
}: DateRangeSelectorProps) {
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(customRange?.start);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(customRange?.end);

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate && onCustomRangeChange) {
      onCustomRangeChange({ start: tempStartDate, end: tempEndDate });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Date Range:</span>
        <Select value={value} onValueChange={(v) => onChange(v as DateRangeOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="this_quarter">This Quarter</SelectItem>
            <SelectItem value="last_quarter">Last Quarter</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
            <SelectItem value="last_year">Last Year</SelectItem>
            <SelectItem value="custom">Custom Range...</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !customRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customRange?.start && customRange?.end ? (
                <>
                  {format(customRange.start, "MMM d, yyyy")} -{" "}
                  {format(customRange.end, "MMM d, yyyy")}
                </>
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Start Date</p>
                <Calendar
                  mode="single"
                  selected={tempStartDate}
                  onSelect={setTempStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">End Date</p>
                <Calendar
                  mode="single"
                  selected={tempEndDate}
                  onSelect={setTempEndDate}
                  disabled={(date) =>
                    tempStartDate ? date < tempStartDate : false
                  }
                  className="pointer-events-auto"
                />
              </div>
              <Button
                onClick={handleApplyCustomRange}
                disabled={!tempStartDate || !tempEndDate}
                className="w-full"
              >
                Apply Range
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
