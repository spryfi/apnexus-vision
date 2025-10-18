import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddCardDialog = ({ open, onOpenChange }: AddCardDialogProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      cardholder_name: "",
      card_brand: "",
      card_type: "",
      first_four: "",
      last_four: "",
      assigned_to: "",
      spending_limit: "",
      is_active: true,
      notes: "",
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees_enhanced")
        .select("id, full_name")
        .eq("status", "Active")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from("company_cards").insert({
        cardholder_name: formData.cardholder_name,
        card_brand: formData.card_brand,
        card_type: formData.card_type,
        first_four: formData.first_four || null,
        last_four: formData.last_four,
        assigned_to: formData.assigned_to || null,
        spending_limit: formData.spending_limit ? parseFloat(formData.spending_limit) : null,
        is_active: formData.is_active,
        notes: formData.notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-cards"] });
      toast.success("Card added successfully");
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to add card");
      console.error(error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Card Name *</Label>
              <Input
                {...register("cardholder_name", { required: true })}
                placeholder="e.g., Company Amex - Marketing"
              />
            </div>

            <div className="space-y-2">
              <Label>Card Brand *</Label>
              <Select onValueChange={(value) => setValue("card_brand", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="American Express">American Express</SelectItem>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="Mastercard">Mastercard</SelectItem>
                  <SelectItem value="Discover">Discover</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Card Type *</Label>
              <Select onValueChange={(value) => setValue("card_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Debit">Debit</SelectItem>
                  <SelectItem value="Fuel">Fuel Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>First Four Digits</Label>
              <Input
                {...register("first_four", {
                  pattern: /^\d{4}$/,
                  maxLength: 4,
                })}
                placeholder="1234"
                maxLength={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Last Four Digits *</Label>
              <Input
                {...register("last_four", {
                  required: true,
                  pattern: /^\d{4}$/,
                  maxLength: 4,
                })}
                placeholder="5678"
                maxLength={4}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Assigned To</Label>
              <Select onValueChange={(value) => setValue("assigned_to", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Spending Limit (optional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("spending_limit")}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center justify-between space-y-2">
              <Label>Active Status</Label>
              <Switch
                checked={watch("is_active")}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Input {...register("notes")} placeholder="Additional notes..." />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Card"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
