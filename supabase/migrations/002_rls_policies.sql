-- ============================================================
-- 002_rls_policies.sql  –  Row Level Security
-- Run AFTER 001_schema.sql
-- ============================================================

-- Helper: get the role of the current user
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.current_user_role() = 'procurement_admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===================== PROFILES =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- ===================== VENDORS =====================
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view vendors"
  ON public.vendors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert vendors"
  ON public.vendors FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any vendor"
  ON public.vendors FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Vendors can update own record"
  ON public.vendors FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete vendors"
  ON public.vendors FOR DELETE
  USING (public.is_admin());

-- ===================== PRODUCTS CATALOG =====================
ALTER TABLE public.products_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view products"
  ON public.products_catalog FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Vendors can insert own products"
  ON public.products_catalog FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors WHERE id = vendor_id AND user_id = auth.uid())
  );

CREATE POLICY "Vendors can update own products"
  ON public.products_catalog FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE id = vendor_id AND user_id = auth.uid())
  );

CREATE POLICY "Vendors can delete own products"
  ON public.products_catalog FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE id = vendor_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins full access to products"
  ON public.products_catalog FOR ALL
  USING (public.is_admin());

-- ===================== REQUISITIONS =====================
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own requisitions"
  ON public.requisitions FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY "Admins can view all requisitions"
  ON public.requisitions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Employees can create requisitions"
  ON public.requisitions FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Employees can update own drafts"
  ON public.requisitions FOR UPDATE
  USING (requester_id = auth.uid() AND status = 'draft')
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Admins can update any requisition"
  ON public.requisitions FOR UPDATE
  USING (public.is_admin());

-- ===================== PURCHASE ORDERS =====================
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with POs"
  ON public.purchase_orders FOR ALL
  USING (public.is_admin());

CREATE POLICY "Employees can view related POs"
  ON public.purchase_orders FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.requisitions
      WHERE requisitions.id = purchase_orders.requisition_id
        AND requisitions.requester_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can view assigned POs"
  ON public.purchase_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = purchase_orders.vendor_id
        AND vendors.user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update PO status"
  ON public.purchase_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = purchase_orders.vendor_id
        AND vendors.user_id = auth.uid()
    )
  );

-- ===================== CONTRACTS =====================
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to contracts"
  ON public.contracts FOR ALL
  USING (public.is_admin());

CREATE POLICY "Vendors can view own contracts"
  ON public.contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = contracts.vendor_id
        AND vendors.user_id = auth.uid()
    )
  );
