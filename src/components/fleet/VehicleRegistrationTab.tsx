import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, AlertTriangle, Download, Eye } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface VehicleRegistration {
  id: string;
  registration_number: string;
  state: string;
  issue_date: string;
  expiry_date: string;
  registration_fee?: number;
  registration_document_url?: string;
  notes?: string;
  status: string;
}

interface VehicleRegistrationTabProps {
  vehicleId: string;
}

export function VehicleRegistrationTab({ vehicleId }: VehicleRegistrationTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: registrations = [] } = useQuery({
    queryKey: ["vehicle-registrations", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_registrations")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("issue_date", { ascending: false });
      
      if (error) throw error;
      return data as unknown as VehicleRegistration[];
    },
  });

  const currentRegistration = registrations.find(r => r.status === "Current");
  
  const getDaysUntilExpiry = (expiryDate: string) => {
    return differenceInDays(new Date(expiryDate), new Date());
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive"> = {
      "Current": "default",
      "Expired": "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vehicle Registration</h2>
          <p className="text-muted-foreground">Manage vehicle registration and compliance</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Registration
        </Button>
      </div>

      {currentRegistration && (
        <>
          {(() => {
            const daysUntilExpiry = getDaysUntilExpiry(currentRegistration.expiry_date);
            if (daysUntilExpiry < 0) {
              return (
                <Card className="border-destructive bg-destructive/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Registration EXPIRED
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Registration expired on {format(new Date(currentRegistration.expiry_date), "MMM d, yyyy")}
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
                      Registration Expiring Soon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-orange-700 dark:text-orange-300">
                      Registration expires in {daysUntilExpiry} days on{" "}
                      {format(new Date(currentRegistration.expiry_date), "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>
              );
            }
          })()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Current Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                    <div>{getStatusBadge(currentRegistration.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Registration Number</div>
                    <div className="text-xl font-bold font-mono">{currentRegistration.registration_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">State</div>
                    <div className="text-lg">{currentRegistration.state}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Issue Date</div>
                    <div>{format(new Date(currentRegistration.issue_date), "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expiry Date</div>
                    <div className="font-semibold">
                      {format(new Date(currentRegistration.expiry_date), "MMM d, yyyy")}
                      {getDaysUntilExpiry(currentRegistration.expiry_date) >= 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({getDaysUntilExpiry(currentRegistration.expiry_date)} days remaining)
                        </span>
                      )}
                    </div>
                  </div>
                  {currentRegistration.registration_fee && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Registration Fee</div>
                      <div className="text-xl font-bold">
                        ${currentRegistration.registration_fee.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                {currentRegistration.registration_document_url && (
                  <>
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View Registration Document
                    </Button>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </>
                )}
                <Button variant="outline">Renew</Button>
                <Button variant="outline">Edit</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registration History</CardTitle>
          <CardDescription>All past registrations for this vehicle</CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No registration records</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first registration</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Registration
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration Number</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Document</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-mono font-medium">{reg.registration_number}</TableCell>
                    <TableCell>{reg.state}</TableCell>
                    <TableCell>{format(new Date(reg.issue_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(reg.expiry_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>${reg.registration_fee?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{getStatusBadge(reg.status)}</TableCell>
                    <TableCell>
                      {reg.registration_document_url && (
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
