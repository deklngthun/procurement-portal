-- ============================================================
-- 003_storage.sql  –  Private Storage Buckets & Policies
-- Run AFTER 002_rls_policies.sql
-- ============================================================

-- Create private buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-documentation', 'vendor-documentation', false);

-- ===================== CONTRACTS BUCKET =====================

-- Admins can upload / read / delete anything in contracts bucket
CREATE POLICY "Admins full access to contracts bucket"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'contracts'
    AND public.is_admin()
  );

-- Vendors can read their own contract files (path: vendor_id/filename)
CREATE POLICY "Vendors can read own contracts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- ===================== VENDOR DOCUMENTATION BUCKET =====================

-- Vendors can upload their own docs (path: vendor_id/filename)
CREATE POLICY "Vendors can upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vendor-documentation'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Vendors can read their own docs
CREATE POLICY "Vendors can read own docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vendor-documentation'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Admins can read all vendor docs
CREATE POLICY "Admins can read all vendor docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vendor-documentation'
    AND public.is_admin()
  );
