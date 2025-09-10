import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Filter, Fuel as FuelIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FuelTransaction {
  id: string;
  driver_name: string;
  vehicle: string;
  transaction_date: string;
  gallons: number;
  cost_per_gallon: number;
  total_cost: number;
  location: string;
  odometer_reading: number;
  card_number: string;
  created_at: string;
}

export default function Fuel() {
  const [fuelTransactions, setFuelTransactions] = useState<FuelTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FuelTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({
    driver: '',
    vehicle: '',
    month: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    driver_name: '',
    vehicle: '',
    transaction_date: '',
    gallons: '',
    cost_per_gallon: '',
    total_cost: '',
    location: '',
    odometer_reading: '',
    card_number: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchFuelTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [fuelTransactions, filters]);

  const fetchFuelTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fuel_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setFuelTransactions(data || []);
    } catch (error) {
      toast({
        title: "Error loading fuel records",
        description: "Could not load fuel transaction data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = fuelTransactions;

    if (filters.driver) {
      filtered = filtered.filter(t => 
        t.driver_name.toLowerCase().includes(filters.driver.toLowerCase())
      );
    }
    if (filters.vehicle) {
      filtered = filtered.filter(t => 
        t.vehicle.toLowerCase().includes(filters.vehicle.toLowerCase())
      );
    }
    if (filters.month) {
      filtered = filtered.filter(t => {
        const transactionMonth = new Date(t.transaction_date).toISOString().slice(0, 7);
        return transactionMonth === filters.month;
      });
    }
    if (filters.search) {
      filtered = filtered.filter(t => 
        t.driver_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.vehicle.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.location.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate total cost
    const totalCost = parseFloat(formData.gallons) * parseFloat(formData.cost_per_gallon);
    
    try {
      const { error } = await supabase
        .from('fuel_transactions')
        .insert([{
          ...formData,
          gallons: parseFloat(formData.gallons),
          cost_per_gallon: parseFloat(formData.cost_per_gallon),
          total_cost: totalCost,
          odometer_reading: parseInt(formData.odometer_reading)
        }]);

      if (error) throw error;

      toast({
        title: "Fuel record added",
        description: "Driver fuel transaction recorded successfully",
      });

      setFormData({
        driver_name: '',
        vehicle: '',
        transaction_date: '',
        gallons: '',
        cost_per_gallon: '',
        total_cost: '',
        location: '',
        odometer_reading: '',
        card_number: ''
      });
      setShowAddDialog(false);
      fetchFuelTransactions();
    } catch (error) {
      toast({
        title: "Error adding fuel record",
        description: "Could not save fuel transaction",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FuelIcon className="h-8 w-8" />
            Driver Fuel Tracking
          </h1>
          <p className="text-muted-foreground">
            Track fuel costs and usage for each driver
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Fuel Record
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search records..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Driver</Label>
              <Input
                placeholder="Driver name..."
                value={filters.driver}
                onChange={(e) => setFilters({ ...filters, driver: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Input
                placeholder="Vehicle..."
                value={filters.vehicle}
                onChange={(e) => setFilters({ ...filters, vehicle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fuel Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Fuel Records ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Gallons</TableHead>
                  <TableHead>Price/Gallon</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Odometer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No fuel records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                      <TableCell className="font-medium">{transaction.driver_name}</TableCell>
                      <TableCell>{transaction.vehicle}</TableCell>
                      <TableCell>{transaction.location}</TableCell>
                      <TableCell>{transaction.gallons.toFixed(2)}</TableCell>
                      <TableCell>{formatCurrency(transaction.cost_per_gallon)}</TableCell>
                      <TableCell>{formatCurrency(transaction.total_cost)}</TableCell>
                      <TableCell>{transaction.odometer_reading?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Fuel Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Fuel Record</DialogTitle>
            <DialogDescription>
              Enter driver fuel transaction details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="driver_name">Driver Name *</Label>
                <Input
                  id="driver_name"
                  required
                  value={formData.driver_name}
                  onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle *</Label>
                <Input
                  id="vehicle"
                  required
                  value={formData.vehicle}
                  onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Transaction Date *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  required
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Gas Station *</Label>
                <Input
                  id="location"
                  required
                  placeholder="e.g. Shell, BP, Exxon"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gallons">Gallons *</Label>
                <Input
                  id="gallons"
                  type="number"
                  step="0.01"
                  required
                  value={formData.gallons}
                  onChange={(e) => setFormData({...formData, gallons: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_per_gallon">Price per Gallon *</Label>
                <Input
                  id="cost_per_gallon"
                  type="number"
                  step="0.01"
                  required
                  value={formData.cost_per_gallon}
                  onChange={(e) => setFormData({...formData, cost_per_gallon: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odometer_reading">Odometer Reading</Label>
                <Input
                  id="odometer_reading"
                  type="number"
                  value={formData.odometer_reading}
                  onChange={(e) => setFormData({...formData, odometer_reading: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card_number">Card Number (last 4)</Label>
                <Input
                  id="card_number"
                  placeholder="Last 4 digits"
                  value={formData.card_number}
                  onChange={(e) => setFormData({...formData, card_number: e.target.value})}
                />
              </div>
            </div>
            {formData.gallons && formData.cost_per_gallon && (
              <div className="text-right">
                <p className="text-lg font-semibold">
                  Total: {formatCurrency(parseFloat(formData.gallons) * parseFloat(formData.cost_per_gallon))}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Fuel Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}