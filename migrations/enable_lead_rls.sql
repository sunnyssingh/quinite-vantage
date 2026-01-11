-- Enable RLS on Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 1. View Leads (SELECT)
CREATE POLICY "Users can view leads in their organization"
  ON public.leads
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- 2. Create Leads (INSERT)
CREATE POLICY "Users can create leads in their organization"
  ON public.leads
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- 3. Update Leads (UPDATE)
CREATE POLICY "Users can update leads in their organization"
  ON public.leads
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- 4. Delete Leads (DELETE)
CREATE POLICY "Users can delete leads in their organization"
  ON public.leads
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );
