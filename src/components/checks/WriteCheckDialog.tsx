import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Camera } from "lucide-react";

interface WriteCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function WriteCheckDialog({ open, onOpenChange, onSuccess }: WriteCheckDialogProps) {
  const [checkNumber, setCheckNumber] = useState("");
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split("T")[0]);
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [vendorId, setVendorId] = useState("");

  const { data: lastCheck } = useQuery({
    queryKey: ["last-check"],
    queryFn: async () => {
      const { data } = await supabase
        .from("checks")
        .select("check_number")
        .order("check_number", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id, vendor_name").order("vendor_name");
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("expense_categories").select("id, category_name").order("category_name");
      return data || [];
    },
  });

  useEffect(() => {
    if (lastCheck?.check_number) {
      const nextNumber = String(Number(lastCheck.check_number) + 1).padStart(4, "0");
      setCheckNumber(nextNumber);
    } else {
      setCheckNumber("1001");
    }
  }, [lastCheck]);

  const numberToWords = (num: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

    if (num === 0) return "Zero";
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " " + numberToWords(num % 100) : "");
    if (num < 1000000) {
      return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "");
    }
    return String(num);
  };

  const amountInWords = amount ? (() => {
    const [dollars, cents] = amount.split(".");
    const dollarsText = numberToWords(Number(dollars));
    const centsText = cents ? cents.padEnd(2, "0") : "00";
    return `${dollarsText} and ${centsText}/100`;
  })() : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!payee || !amount || !categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (Number(amount) <= 0) {
      toast.error("Amount must be positive");
      return;
    }

    if (Number(amount) > 10000) {
      const confirmed = window.confirm(`This check is for $${Number(amount).toFixed(2)}. Are you sure you want to proceed?`);
      if (!confirmed) return;
    }

    const { error } = await supabase.from("checks").insert({
      check_number: checkNumber,
      check_date: checkDate,
      payee,
      amount: Number(amount),
      memo,
      category_id: categoryId,
      vendor_id: vendorId || null,
      status: "Written",
    });

    if (error) {
      toast.error("Failed to write check: " + error.message);
      return;
    }

    toast.success(`Check #${checkNumber} written successfully`);
    onSuccess();
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setPayee("");
    setAmount("");
    setMemo("");
    setCategoryId("");
    setVendorId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write Check</DialogTitle>
        </DialogHeader>

        <div className="border-2 border-muted rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 mb-6">
          <div className="flex justify-between mb-8">
            <div className="text-lg font-bold">Your Company Name</div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Check #</div>
              <div className="text-2xl font-mono font-bold">{checkNumber}</div>
            </div>
          </div>
          <div className="flex justify-between mb-6">
            <div className="text-sm text-muted-foreground">Date</div>
            <div className="font-mono">{checkDate}</div>
          </div>
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-1">Pay to the Order of</div>
            <div className="border-b-2 border-foreground pb-1 min-h-[28px] font-semibold">
              {payee || "_".repeat(50)}
            </div>
          </div>
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 mr-4">
              <div className="text-sm text-muted-foreground mb-1">Amount in Words</div>
              <div className="border-b-2 border-foreground pb-1 min-h-[28px] italic">
                {amountInWords || "_".repeat(80)}
              </div>
            </div>
            <div className="border-2 border-foreground px-4 py-2 bg-white dark:bg-background rounded">
              <div className="text-2xl font-bold font-mono">
                ${amount || "0.00"}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Memo</div>
            <div className="border-b-2 border-foreground pb-1 min-h-[28px]">
              {memo || "_".repeat(40)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check-number">Check Number*</Label>
              <Input
                id="check-number"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="check-date">Date*</Label>
              <Input
                id="check-date"
                type="date"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payee">Pay to the Order of*</Label>
              <Select value={vendorId} onValueChange={(value) => {
                setVendorId(value);
                const vendor = vendors.find(v => v.id === value);
                if (vendor) setPayee(vendor.vendor_name);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount*</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category*</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="memo">Memo</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Scan Check Image
            </Button>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Write Check</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
