import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Shield, AlertTriangle, Download, Eye } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

interface InsurancePolicy {
  id: string;
  provider: string;
  policy_number: string;
  effective_date: string;
  expiry_date: string;
  coverage_type: string;
  premium_amount: number;
  deductible: number;
  status: string;
  policy_document_url?: string;
  insurance_card_front_url?: string;
  notes?: string;
}

interface VehicleInsuranceTabProps {
  vehicleId: string;
}

export function VehicleInsuranceTab({ vehicleId }: VehicleInsuranceTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: insurancePolicies = [], refetch } = useQuery({
    queryKey: ["vehicle-insurance", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_insurance")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("effective_date", { ascending: false });
      
      if (error) throw error;
      return data as unknown as InsurancePolicy[];
    },
  });

  const activePolicy = insurancePolicies.find(p => p.status === "Active");
  
  const getDaysUntilExpiry = (expiryDate: string) => {
    return differenceInDays(new Date(expiryDate), new Date());
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "Active": "default",
      "Expired": "destructive",
      "Cancelled": "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Insurance Policies</h2>
          <p className="text-muted-foreground">Manage vehicle insurance coverage and documents</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Insurance Policy
        </Button>
      </div>

      {activePolicy && (
        <>
          {(() => {
            const daysUntilExpiry = getDaysUntilExpiry(activePolicy.expiry_date);
            if (daysUntilExpiry < 0) {
              return (
                <Card className="border-destructive bg-destructive/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Insurance EXPIRED
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Insurance expired on {format(new Date(activePolicy.expiry_date), "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>
              );
            } else if (daysUntilExpiry <= 30) {
              return (
                <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                      <AlertTriangle className="h-5 w-5" />
                      Insurance Expiring Soon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-orange-700 dark:text-orange-300">
                      Insurance expires in {daysUntilExpiry} days on{" "}
                      {format(new Date(activePolicy.expiry_date), "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>
              );
            }
          })()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Insurance Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                    <div>{getStatusBadge(activePolicy.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Provider</div>
                    <div className="text-xl font-bold">{activePolicy.provider}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Policy Number</div>
                    <div className="font-mono">{activePolicy.policy_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Coverage Type</div>
                    <div>{activePolicy.coverage_type}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Effective Date</div>
                    <div>{format(new Date(activePolicy.effective_date), "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expiry Date</div>
                    <div className="font-semibold">
                      {format(new Date(activePolicy.expiry_date), "MMM d, yyyy")}
                      {getDaysUntilExpiry(activePolicy.expiry_date) >= 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({getDaysUntilExpiry(activePolicy.expiry_date)} days remaining)
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Premium Amount</div>
                    <div className="text-xl font-bold">
                      ${activePolicy.premium_amount?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  {activePolicy.deductible && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Deductible</div>
                      <div>${activePolicy.deductible.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                {activePolicy.policy_document_url && (
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Policy Document
                  </Button>
                )}
                {activePolicy.insurance_card_front_url && (
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download Insurance Card
                  </Button>
                )}
                <Button variant="outline">Renew Policy</Button>
                <Button variant="outline">Edit</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Insurance History</CardTitle>
          <CardDescription>All past insurance policies for this vehicle</CardDescription>
        </CardHeader>
        <CardContent>
          {insurancePolicies.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No insurance records</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first insurance policy</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Insurance Policy
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Policy Number</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Coverage Type</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insurancePolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.provider}</TableCell>
                    <TableCell className="font-mono">{policy.policy_number}</TableCell>
                    <TableCell>{format(new Date(policy.effective_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(policy.expiry_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{policy.coverage_type}</TableCell>
                    <TableCell>${policy.premium_amount?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{getStatusBadge(policy.status)}</TableCell>
                    <TableCell>
                      {policy.policy_document_url && (
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
