import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CheckCircle,
  AlertCircle,
  FileWarning,
  Eye,
  Edit,
  DollarSign,
  Trash2,
  UserCheck,
  XCircle,
  Clock,
  FileText,
  CreditCard,
  Fuel,
  FileCheck,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";

interface ExpenseTransaction {
  id: string;
  expense_type: string;
  transaction_date: string;
  amount: number;
  description: string;
  vendor_id?: string;
  vendors?: { vendor_name: string };
  employee_id?: string;
  employees_enhanced?: { full_name: string };
  category_id?: string;
  expense_categories?: { category_name: string };
  invoice_number?: string;
  check_number?: string;
  payment_status: string;
  approval_status: string;
  due_date?: string;
  days_until_due?: number;
  is_overdue?: boolean;
  receipt_url?: string;
  receipt_required: boolean;
  has_receipt: boolean;
}

interface ExpenseTableProps {
  expenses: ExpenseTransaction[];
  activeTab: string;
  onViewReceipt: (url: string) => void;
  onUploadReceipt: (id: string) => void;
  onEdit: (expense: ExpenseTransaction) => void;
  onMarkAsPaid: (expense: ExpenseTransaction) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getExpenseTypeConfig = (type: string) => {
  const configs: Record<string, { label: string; icon: any; color: string }> = {
    vendor_invoice: { label: 'Vendor Invoice', icon: FileText, color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    credit_card_purchase: { label: 'Credit Card', icon: CreditCard, color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
    fuel_purchase: { label: 'Fuel', icon: Fuel, color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' },
    check_payment: { label: 'Check', icon: FileCheck, color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
    employee_reimbursement: { label: 'Reimbursement', icon: UserCheck, color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
    recurring_bill: { label: 'Recurring', icon: RefreshCw, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
    other: { label: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  };
  return configs[type] || configs.other;
};

const getPaymentStatusBadge = (status: string) => {
  const configs: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' },
    approved: { label: 'Approved', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
    overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  };
  const config = configs[status] || configs.pending;
  return <Badge className={config.className}>{config.label}</Badge>;
};

const getApprovalStatusBadge = (status: string) => {
  const configs: Record<string, { label: string; className: string; icon: any }> = {
    pending_review: { label: 'Pending Review', className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300', icon: Clock },
    auto_approved: { label: 'Auto-Approved', className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300', icon: CheckCircle },
    admin_approved: { label: 'Admin Approved', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300', icon: UserCheck },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300', icon: XCircle },
  };
  const config = configs[status] || configs.pending_review;
  const Icon = config.icon;
  
  return (
    <Badge className={`${config.className} flex items-center gap-1 w-fit`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export function ExpenseTable({
  expenses,
  activeTab,
  onViewReceipt,
  onUploadReceipt,
  onEdit,
  onMarkAsPaid,
  onApprove,
  onDelete,
  isAdmin = false,
}: ExpenseTableProps) {
  const showInvoiceNumber = activeTab === 'all' || activeTab === 'by-type';
  const showEmployee = activeTab === 'by-employee' || activeTab === 'all';

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {showInvoiceNumber && <TableHead>Invoice #</TableHead>}
            {showEmployee && <TableHead>Employee</TableHead>}
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Receipt</TableHead>
            <TableHead>Approval</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showInvoiceNumber && showEmployee ? 12 : 11} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No expenses found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or add your first expense
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => {
              const typeConfig = getExpenseTypeConfig(expense.expense_type);
              const TypeIcon = typeConfig.icon;

              return (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(expense.transaction_date), 'MMM dd, yyyy')}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className={typeConfig.color}>
                      <TypeIcon className="h-3 w-3 mr-1" />
                      {typeConfig.label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>{expense.vendors?.vendor_name || '-'}</TableCell>
                  
                  <TableCell>
                    <div className="max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  
                  {showInvoiceNumber && (
                    <TableCell>{expense.invoice_number || '-'}</TableCell>
                  )}
                  
                  {showEmployee && (
                    <TableCell>{expense.employees_enhanced?.full_name || '-'}</TableCell>
                  )}
                  
                  <TableCell>
                    {expense.due_date ? (
                      <div className="flex flex-col gap-1">
                        <span className="whitespace-nowrap">
                          {format(new Date(expense.due_date), 'MMM dd, yyyy')}
                        </span>
                        {expense.is_overdue && expense.days_until_due && (
                          <Badge variant="destructive" className="text-xs w-fit">
                            {Math.abs(expense.days_until_due)} days overdue
                          </Badge>
                        )}
                        {!expense.is_overdue && expense.days_until_due && expense.days_until_due <= 7 && expense.days_until_due >= 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs w-fit">
                            {expense.days_until_due} days
                          </Badge>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  
                  <TableCell>{getPaymentStatusBadge(expense.payment_status)}</TableCell>
                  
                  <TableCell>
                    {expense.has_receipt ? (
                      <button
                        onClick={() => onViewReceipt(expense.receipt_url!)}
                        className="flex items-center gap-1 text-green-600 hover:text-green-800"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">View</span>
                      </button>
                    ) : expense.receipt_required ? (
                      <button
                        onClick={() => onUploadReceipt(expense.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">Required</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUploadReceipt(expense.id)}
                        className="flex items-center gap-1 text-gray-400 hover:text-gray-600"
                      >
                        <FileWarning className="h-4 w-4" />
                        <span className="text-xs">Optional</span>
                      </button>
                    )}
                  </TableCell>
                  
                  <TableCell>{getApprovalStatusBadge(expense.approval_status)}</TableCell>
                  
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(expense)}
                        title="Edit Expense"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {expense.payment_status !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMarkAsPaid(expense)}
                          title="Mark as Paid"
                          className="text-green-600 hover:text-green-800"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {expense.approval_status === 'pending_review' && isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onApprove(expense.id)}
                          title="Approve Expense"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(expense.id)}
                        title="Delete Expense"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
