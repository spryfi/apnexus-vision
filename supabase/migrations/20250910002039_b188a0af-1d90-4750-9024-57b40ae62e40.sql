-- Create custom types for enums (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('Pending Approval', 'Approved for Payment', 'Paid', 'Reconciled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('Credit Card', 'ACH', 'Check', 'Fleet Fuel Card', 'Debit Card');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create expense_categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone_number TEXT,
  full_address TEXT,
  default_expense_category_id UUID REFERENCES public.expense_categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status transaction_status NOT NULL DEFAULT 'Pending Approval',
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  invoice_number TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE,
  amount DECIMAL(10,2) NOT NULL,
  expense_category_id UUID NOT NULL REFERENCES public.expense_categories(id),
  purchase_description TEXT NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  payment_method payment_method NOT NULL,
  payment_source TEXT,
  invoice_receipt_url TEXT,
  paid_date DATE,
  check_number TEXT,
  audit_trail TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can access expense_categories" ON public.expense_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can access employees" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can access vendors" ON public.vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can access transactions" ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to update audit trail
CREATE OR REPLACE FUNCTION public.update_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Get user name from user_profiles
  SELECT full_name INTO user_name 
  FROM public.user_profiles 
  WHERE user_id = auth.uid();
  
  -- Update audit trail when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.audit_trail = COALESCE(OLD.audit_trail, '') || 
      CASE 
        WHEN NEW.status = 'Approved for Payment' THEN 'Approved by ' || COALESCE(user_name, 'System') || ' on ' || NOW()::DATE || '. '
        WHEN NEW.status = 'Paid' THEN 'Marked as Paid by ' || COALESCE(user_name, 'System') || ' on ' || NOW()::DATE || '. '
        WHEN NEW.status = 'Reconciled' THEN 'Reconciled by ' || COALESCE(user_name, 'System') || ' on ' || NOW()::DATE || '. '
        ELSE 'Status changed to ' || NEW.status || ' by ' || COALESCE(user_name, 'System') || ' on ' || NOW()::DATE || '. '
      END;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for audit trail updates
CREATE TRIGGER update_transaction_audit_trail
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_audit_trail();

-- Create storage bucket for invoice receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-receipts', 'invoice-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for invoice receipts
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'invoice-receipts');

CREATE POLICY "Authenticated users can view receipts" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'invoice-receipts');

CREATE POLICY "Authenticated users can update receipts" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'invoice-receipts');

-- Insert sample data
INSERT INTO public.expense_categories (category_name) VALUES 
('Materials - Job Supplies'),
('Fuel'),
('Vehicle Maintenance'),
('Software & Subscriptions'),
('Office Supplies'),
('Utilities'),
('Professional Services'),
('Insurance');

INSERT INTO public.employees (employee_name, role) VALUES 
('John Smith', 'Project Manager'),
('Sarah Johnson', 'Field Supervisor'),
('Mike Davis', 'Office Administrator'),
('Lisa Wilson', 'Accountant');