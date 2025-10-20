import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Calendar, DollarSign, Wrench, FileCheck, FileX } from "lucide-react";
import { format } from "date-fns";
import { MaintenanceDetailDialog } from "@/components/fleet/MaintenanceDetailDialog";
import { AddMaintenanceWizard } from "@/components/AddMaintenanceWizard";

export default function FleetMaintenance() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Fetch all vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'Active')
        .order('vehicle_name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch maintenance records with filtering
  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ['maintenance-all', selectedVehicle, searchTerm, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_records')
        .select(`
          *,
          vehicles(id, vehicle_name, make, model, year),
          vendors(vendor_name),
          maintenance_line_items(
            id,
            description,
            part_number,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('service_date', { ascending: false });

      // Filter by vehicle
      if (selectedVehicle !== 'all') {
        query = query.eq('vehicle_id', selectedVehicle);
      }

      // Filter by search term
      if (searchTerm) {
        query = query.or(`service_description.ilike.%${searchTerm}%,vendors.vendor_name.ilike.%${searchTerm}%`);
      }

      // Filter by date range
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateFilter) {
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'last_3_months':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'last_6_months':
            startDate.setMonth(now.getMonth() - 6);
            break;
          case 'this_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }
        
        query = query.gte('service_date', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Calculate summary metrics
  const totalCost = maintenanceRecords?.reduce((sum, record) => sum + parseFloat(String(record.cost || 0)), 0) || 0;
  const recordCount = maintenanceRecords?.length || 0;
  const avgCost = recordCount > 0 ? totalCost / recordCount : 0;
  const uniqueVehicles = new Set(maintenanceRecords?.map(r => r.vehicle_id)).size;

  const thisMonthRecords = maintenanceRecords?.filter(r => {
    const serviceDate = new Date(r.service_date);
    const now = new Date();
    return serviceDate.getMonth() === now.getMonth() && 
           serviceDate.getFullYear() === now.getFullYear();
  }).length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fleet Maintenance</h1>
          <p className="text-muted-foreground">Track and manage all vehicle maintenance records</p>
        </div>
        <Button onClick={() => setWizardOpen(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Add Maintenance
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <Wrench className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{recordCount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {uniqueVehicles} vehicle{uniqueVehicles !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {dateFilter === 'all' ? 'All time' : 'Selected period'}
          </p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Average Cost</p>
            <DollarSign className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold">${avgCost.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Per service</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">This Month</p>
            <Calendar className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold">{thisMonthRecords}</p>
          <p className="text-xs text-muted-foreground mt-1">Services completed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Vehicle Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Vehicle</label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger>
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles?.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Time Period</label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by description or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => {
            setSelectedVehicle('all');
            setDateFilter('all');
            setSearchTerm('');
          }}>
            Clear Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Maintenance Records Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading maintenance records...</p>
          </div>
        ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Vehicle</th>
                  <th className="text-left p-4 font-semibold">Description</th>
                  <th className="text-left p-4 font-semibold">Provider</th>
                  <th className="text-right p-4 font-semibold">Odometer</th>
                  <th className="text-right p-4 font-semibold">Cost</th>
                  <th className="text-center p-4 font-semibold">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceRecords.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => {
                      setSelectedRecord(record);
                      setDetailDialogOpen(true);
                    }}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      {format(new Date(record.service_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{record.vehicles?.vehicle_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.vehicles?.year} {record.vehicles?.make} {record.vehicles?.model}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="max-w-xs truncate" title={record.service_description}>
                        {record.service_description}
                      </p>
                      {record.maintenance_line_items && record.maintenance_line_items.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {record.maintenance_line_items.length} line item{record.maintenance_line_items.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </td>
                    <td className="p-4">{record.vendors?.vendor_name || '-'}</td>
                    <td className="p-4 text-right">
                      {record.odometer_at_service ? `${record.odometer_at_service.toLocaleString()} mi` : '-'}
                    </td>
                    <td className="p-4 text-right font-semibold">
                      ${parseFloat(String(record.cost || 0)).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      {record.receipt_scan_url ? (
                        <FileCheck className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <FileX className="h-5 w-5 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">No maintenance records found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedVehicle !== 'all' || searchTerm || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first maintenance record'}
            </p>
            <Button onClick={() => setWizardOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance Record
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddMaintenanceWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      {selectedRecord && (
        <MaintenanceDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          maintenanceId={selectedRecord.id}
          maintenanceData={selectedRecord}
        />
      )}
    </div>
  );
}
