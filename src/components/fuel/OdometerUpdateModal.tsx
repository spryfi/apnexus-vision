import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OdometerUpdate {
  vehicle_id: string;
  previous_odometer: number;
  new_odometer: number;
  change: number;
}

interface OdometerUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updates: OdometerUpdate[];
}

export function OdometerUpdateModal({ isOpen, onClose, updates }: OdometerUpdateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle>Vehicle Odometers Updated</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {updates.length} vehicle{updates.length !== 1 ? 's' : ''} updated based on latest fuel transactions
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Previous</TableHead>
                <TableHead className="text-center">
                  <TrendingUp className="h-4 w-4 mx-auto" />
                </TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updates.map((update) => (
                <TableRow key={update.vehicle_id}>
                  <TableCell className="font-medium">{update.vehicle_id}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {update.previous_odometer.toLocaleString()} mi
                  </TableCell>
                  <TableCell className="text-center">
                    →
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {update.new_odometer.toLocaleString()} mi
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      +{update.change.toLocaleString()} mi
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded">
            <History className="h-4 w-4" />
            <p>
              Odometer updates have been logged in vehicle history. 
              You can view or undo these changes from the vehicle detail page.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
