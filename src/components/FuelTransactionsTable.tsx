import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Edit, 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  Calendar as CalendarIcon,
  Download
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface FuelTransaction {
  id: string;
  transaction_date: string;
  employee_name: string;
  vehicle_id: string | null;
  gallons: number;
  cost_per_gallon: number;
  total_cost: number;
  odometer: number;
  merchant_name: string | null;
  status: string;
  flag_reason: string | null;
}

interface FuelTransactionsTableProps {
  transactions: FuelTransaction[];
  loading: boolean;
  onEditTransaction: (transaction: FuelTransaction) => void;
  onReviewTransaction: (transaction: FuelTransaction) => void;
}

type SortField = 'transaction_date' | 'employee_name' | 'vehicle_id' | 'odometer' | 'gallons' | 'cost_per_gallon' | 'total_cost';
type SortDirection = 'asc' | 'desc';

export function FuelTransactionsTable({ 
  transactions, 
  loading,
  onEditTransaction,
  onReviewTransaction
}: FuelTransactionsTableProps) {
  const navigate = useNavigate();
  
  // State
  const [sortField, setSortField] = useState<SortField>('transaction_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // Filters
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Get unique values for filters
  const uniqueVehicles = useMemo(() => {
    const vehicles = new Set(transactions.map(t => t.vehicle_id).filter(Boolean));
    return Array.from(vehicles).sort();
  }, [transactions]);

  const uniqueDrivers = useMemo(() => {
    const drivers = new Set(transactions.map(t => t.employee_name).filter(Boolean));
    return Array.from(drivers).sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Vehicle filter
      if (vehicleFilter !== 'all') {
        if (vehicleFilter === 'unmatched' && t.vehicle_id) return false;
        if (vehicleFilter !== 'unmatched' && t.vehicle_id !== vehicleFilter) return false;
      }
      
      // Driver filter
      if (driverFilter !== 'all' && t.employee_name !== driverFilter) return false;
      
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'needs_review' && t.status !== 'Flagged for Review') return false;
        if (statusFilter === 'verified' && t.status !== 'Verified') return false;
      }
      
      // Search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesMerchant = t.merchant_name?.toLowerCase().includes(searchLower);
        const matchesDriver = t.employee_name?.toLowerCase().includes(searchLower);
        if (!matchesMerchant && !matchesDriver) return false;
      }
      
      // Date range
      const transDate = new Date(t.transaction_date);
      if (dateFrom && transDate < dateFrom) return false;
      if (dateTo && transDate > dateTo) return false;
      
      return true;
    });
  }, [transactions, vehicleFilter, driverFilter, statusFilter, searchTerm, dateFrom, dateTo]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredTransactions, sortField, sortDirection]);

  // Paginate
  const paginatedTransactions = useMemo(() => {
    if (pageSize === -1) return sortedTransactions; // Show all
    const start = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedTransactions.length / pageSize);

  // Calculate summaries
  const summary = useMemo(() => {
    return {
      totalTransactions: filteredTransactions.length,
      totalGallons: filteredTransactions.reduce((sum, t) => sum + t.gallons, 0),
      totalCost: filteredTransactions.reduce((sum, t) => sum + t.total_cost, 0),
      avgPricePerGallon: filteredTransactions.length > 0
        ? filteredTransactions.reduce((sum, t) => sum + t.total_cost, 0) / 
          filteredTransactions.reduce((sum, t) => sum + t.gallons, 0)
        : 0
    };
  }, [filteredTransactions]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedTransactions.map(t => t.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleVehicleClick = (vehicleId: string | null) => {
    if (vehicleId) {
      navigate(`/fleet/${vehicleId}?tab=fuel`);
    }
  };

  const handleBulkExport = () => {
    const selectedTransactions = transactions.filter(t => selectedRows.has(t.id));
    const csv = convertToCSV(selectedTransactions);
    downloadCSV(csv, 'fuel-transactions.csv');
  };

  const convertToCSV = (data: FuelTransaction[]) => {
    const headers = ['Date', 'Driver', 'Vehicle', 'Odometer', 'Merchant', 'Gallons', 'Price/Gal', 'Total', 'Status'];
    const rows = data.map(t => [
      format(new Date(t.transaction_date), 'MM/dd/yyyy'),
      t.employee_name,
      t.vehicle_id || 'Unmatched',
      t.odometer,
      t.merchant_name || '',
      t.gallons.toFixed(2),
      t.cost_per_gallon.toFixed(2),
      t.total_cost.toFixed(2),
      t.status
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'Flagged for Review':
        return <Badge className="bg-red-100 text-red-800">Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MM/dd/yyyy');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No transactions found for this statement period</p>
          <Button onClick={() => window.location.reload()}>Upload Statement</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            <SelectItem value="unmatched">Unmatched</SelectItem>
            {uniqueVehicles.map(v => (
              <SelectItem key={v} value={v!}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={driverFilter} onValueChange={setDriverFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {uniqueDrivers.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="needs_review">Needs Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(!dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "PP") : "From Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(!dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "PP") : "To Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Input
          placeholder="Search merchant or driver..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedRows.size} selected</span>
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedRows.size === paginatedTransactions.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('transaction_date')}>
                <div className="flex items-center gap-2">
                  Date {getSortIcon('transaction_date')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('employee_name')}>
                <div className="flex items-center gap-2">
                  Driver {getSortIcon('employee_name')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('vehicle_id')}>
                <div className="flex items-center gap-2">
                  Vehicle {getSortIcon('vehicle_id')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('odometer')}>
                <div className="flex items-center justify-end gap-2">
                  Odometer {getSortIcon('odometer')}
                </div>
              </TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('gallons')}>
                <div className="flex items-center justify-end gap-2">
                  Gallons {getSortIcon('gallons')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('cost_per_gallon')}>
                <div className="flex items-center justify-end gap-2">
                  Price/Gal {getSortIcon('cost_per_gallon')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('total_cost')}>
                <div className="flex items-center justify-end gap-2">
                  Total {getSortIcon('total_cost')}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedRows.has(transaction.id)}
                    onCheckedChange={(checked) => handleSelectRow(transaction.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                <TableCell className="font-medium">{transaction.employee_name}</TableCell>
                <TableCell>
                  {transaction.vehicle_id ? (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal"
                      onClick={() => handleVehicleClick(transaction.vehicle_id)}
                    >
                      {transaction.vehicle_id}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">Unmatched</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{transaction.odometer.toLocaleString()} mi</TableCell>
                <TableCell className="text-sm">{transaction.merchant_name || 'Unknown'}</TableCell>
                <TableCell className="text-right">{transaction.gallons.toFixed(2)} gal</TableCell>
                <TableCell className="text-right">{formatCurrency(transaction.cost_per_gallon)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(transaction.total_cost)}</TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditTransaction(transaction)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {transaction.status === 'Flagged for Review' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onReviewTransaction(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary Row */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{summary.totalTransactions}</div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{summary.totalGallons.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Gallons</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(summary.avgPricePerGallon)}</div>
              <div className="text-sm text-muted-foreground">Avg Price/Gal</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="-1">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
