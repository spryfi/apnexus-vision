# Accounts Payable - Unified Expense Management

## Testing & Validation Checklist

### ✅ Vendor Invoice Tests
- [x] Invoice number required
- [x] Due date required  
- [x] Receipt optional (unless ≥$500)
- [x] Auto-approves if <$2,500 and no receipt required
- [x] Validation prevents submission without required fields

### ✅ Credit Card Purchase Tests
- [x] No invoice number field shown
- [x] Receipt REQUIRED (enforced)
- [x] Credit card dropdown required
- [x] Employee dropdown required
- [x] Cannot save without receipt
- [x] Flagged for review if no receipt uploaded

### ✅ Check Payment Tests
- [x] Check number required and validated
- [x] Receipt REQUIRED (enforced)
- [x] Cannot save without receipt
- [x] Payment method properly tracked

### ✅ Employee Reimbursement Tests
- [x] Employee dropdown required
- [x] Receipt REQUIRED (enforced)
- [x] Flagged for review if no receipt
- [x] Auto-approval logic applied correctly

### ✅ Expense ≥ $500 Tests
- [x] Receipt becomes required regardless of type
- [x] Warning message displays in real-time
- [x] Cannot save without receipt
- [x] Dynamic validation updates as amount changes

### ✅ Admin Review Queue Tests
- [x] Shows all flagged expenses (approval_status = 'pending_review')
- [x] Admin can approve with optional notes
- [x] Admin can reject with required reason
- [x] Clears flag when approved
- [x] Updates approval_status correctly
- [x] Real-time query updates on approval/rejection

### ✅ Receipt Upload Tests
- [x] Uploads to Supabase Storage (receipt-images bucket)
- [x] Updates expense record with receipt_url
- [x] Sets has_receipt = true
- [x] Clears review flag (flagged_for_review = false)
- [x] Auto-approves if that was only issue
- [x] File validation (type, size)

### ✅ Mark as Paid Tests
- [x] Requires payment date
- [x] Requires payment method
- [x] Requires payment confirmation upload
- [x] Updates payment_status to 'paid'
- [x] Records payment_date
- [x] Tracks approved_by and approved_at

## Integration Tests

### Fuel Purchase Auto-Import
The `import-verified-fuel-transactions` edge function now:
- Creates expense_transactions from verified fuel purchases
- Sets expense_type = 'fuel_purchase'
- Marks as payment_status = 'paid' (pre-paid)
- Auto-approves verified transactions
- Flags questionable transactions for review
- Links to fuel_statement_id
- Updates odometer readings for fleet vehicles

### Credit Card Integration
- Credit card transactions can be linked via credit_card_id
- Bidirectional references maintained
- Receipt requirements enforced
- Employee tracking included

## Migration Strategy

The migration script (`migrations/migrate_to_unified_expenses.sql`) consolidates:

1. **Vendor Invoices** (from transactions table)
   - Maps status to payment_status
   - Determines approval_status based on amount and status
   - Preserves receipt URLs and payment confirmations
   - Maintains vendor relationships

2. **Fuel Transactions** (from fuel_transactions_new)
   - Auto-categorizes as fuel_purchase
   - Sets payment_status = 'paid' (pre-paid via WEX)
   - Flags unverified transactions for review
   - Links vehicle and driver data

3. **Credit Card Purchases** (from credit_card_transactions)
   - Enforces receipt requirements
   - Links to employees and cards
   - Categorizes by existing category_id
   - Tracks receipt upload status

### Migration Safety Features
- Prevents duplicates with NOT EXISTS checks
- Preserves all timestamps (created_at, updated_at)
- Maps old statuses to new approval workflow
- Creates performance indexes
- Includes verification queries
- Flags missing receipts automatically

### Post-Migration Verification
```sql
-- Verify record counts
SELECT 
  expense_type,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN has_receipt = true THEN 1 END) as with_receipts,
  COUNT(CASE WHEN approval_status = 'pending_review' THEN 1 END) as needs_review
FROM expense_transactions
GROUP BY expense_type;

-- Check for missing required receipts
SELECT COUNT(*) as missing_receipts
FROM expense_transactions
WHERE receipt_required = true 
AND has_receipt = false;
```

## Validation Rules Summary

| Expense Type | Invoice # | Receipt | Due Date | Check # | Card | Employee |
|-------------|-----------|---------|----------|---------|------|----------|
| Vendor Invoice | Required | If ≥$500 | Required | - | - | - |
| Credit Card | - | **Required** | - | - | Required | Required |
| Fuel Purchase | Auto | **Required** | - | - | - | Optional |
| Check Payment | - | **Required** | - | Required | - | - |
| Reimbursement | - | **Required** | - | - | - | Required |
| Recurring Bill | - | If ≥$500 | Required | - | - | - |
| Other | - | If ≥$500 | - | - | - | - |

## Approval Workflow

```
New Expense Created
       ↓
Amount < $2,500 && Has Required Receipts?
       ↓
    YES → auto_approved
       ↓
    NO → pending_review
       ↓
Admin Reviews
       ↓
Approve → admin_approved
       ↓
Reject → rejected
```

## Implementation Status

✅ **Completed Features:**
- Expense type wizard with 7 different expense types
- Dynamic form fields based on expense type
- Real-time validation and field requirements
- Receipt upload with file validation
- Receipt viewer with zoom, rotate, print
- Admin review queue with approve/reject
- Mark as paid workflow with payment confirmation
- Fuel purchase auto-import integration
- Database migration scripts
- Performance indexes
- All test cases verified

🎯 **Production Ready**
This unified expense management system is enterprise-grade and ready for production use.
