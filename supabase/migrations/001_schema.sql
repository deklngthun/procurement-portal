-- ============================================================
-- 001_schema.sql  –  Procurement & SRM Portal
-- Run this in the Supabase SQL Editor first.
-- ============================================================

-- -------------------- ENUMS --------------------
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('employee','procurement_admin','vendor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.requisition_status AS ENUM ('draft','pending','approved','rejected','ordered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.po_status AS ENUM ('draft','issued','acknowledged','shipped','delivered','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contract_status AS ENUM ('draft','active','expired','terminated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -------------------- PROFILES --------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  role       public.user_role NOT NULL DEFAULT 'employee',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    CASE
      WHEN NEW.raw_user_meta_data ->> 'role' IN ('employee','procurement_admin','vendor')
      THEN (NEW.raw_user_meta_data ->> 'role')::public.user_role
      ELSE 'employee'::public.user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------- VENDORS --------------------
CREATE TABLE IF NOT EXISTS public.vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_name  TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone         TEXT,
  address       TEXT,
  category      TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  rating        NUMERIC(2,1) DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_user   ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);

-- -------------------- PRODUCTS CATALOG --------------------
CREATE TABLE IF NOT EXISTS public.products_catalog (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  sku            TEXT UNIQUE,
  description    TEXT,
  unit_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  category       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products_catalog(vendor_id);

-- -------------------- REQUISITIONS --------------------
CREATE TABLE IF NOT EXISTS public.requisitions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  line_items   JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status       public.requisition_status NOT NULL DEFAULT 'draft',
  priority     TEXT NOT NULL DEFAULT 'medium',
  approved_by  UUID REFERENCES public.profiles(id),
  approved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requisitions_requester ON public.requisitions(requester_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_status    ON public.requisitions(status);

-- -------------------- PURCHASE ORDERS --------------------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number         TEXT UNIQUE NOT NULL DEFAULT '',
  vendor_id         UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  requisition_id    UUID REFERENCES public.requisitions(id) ON DELETE SET NULL,
  created_by        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  line_items        JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  status            public.po_status NOT NULL DEFAULT 'draft',
  expected_delivery DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_vendor      ON public.purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_requisition ON public.purchase_orders(requisition_id);
CREATE INDEX IF NOT EXISTS idx_po_status      ON public.purchase_orders(status);

-- Auto-generate PO number
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := 'PO-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || SUBSTR(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_po_number ON public.purchase_orders;
CREATE TRIGGER trg_po_number
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_po_number();

-- -------------------- CONTRACTS --------------------
CREATE TABLE IF NOT EXISTS public.contracts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  file_path  TEXT,
  start_date DATE,
  end_date   DATE,
  value      NUMERIC(14,2) NOT NULL DEFAULT 0,
  status     public.contract_status NOT NULL DEFAULT 'draft',
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_vendor ON public.contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);

-- -------------------- updated_at trigger --------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at     ON public.profiles;
DROP TRIGGER IF EXISTS set_vendors_updated_at      ON public.vendors;
DROP TRIGGER IF EXISTS set_products_updated_at     ON public.products_catalog;
DROP TRIGGER IF EXISTS set_requisitions_updated_at ON public.requisitions;
DROP TRIGGER IF EXISTS set_po_updated_at           ON public.purchase_orders;
DROP TRIGGER IF EXISTS set_contracts_updated_at    ON public.contracts;

CREATE TRIGGER set_profiles_updated_at     BEFORE UPDATE ON public.profiles          FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_vendors_updated_at      BEFORE UPDATE ON public.vendors           FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_products_updated_at     BEFORE UPDATE ON public.products_catalog  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_requisitions_updated_at BEFORE UPDATE ON public.requisitions      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_po_updated_at           BEFORE UPDATE ON public.purchase_orders   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_contracts_updated_at    BEFORE UPDATE ON public.contracts         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable realtime on purchase_orders for live tracking
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
