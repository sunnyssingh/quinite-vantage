-- Migration: 009_create_inventory_schema.sql
-- Description: Adds tables for Inventory/Property Management

-- 1. Create Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  
  title text NOT NULL,
  description text,
  address text,
  
  price numeric(12, 2) NOT NULL,
  size_sqft int,
  bedrooms int,
  bathrooms int,
  
  type text NOT NULL, -- 'apartment', 'villa', 'plot', 'commercial'
  status text NOT NULL DEFAULT 'available', -- 'available', 'sold', 'reserved', 'rented'
  
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create Property Images Table
CREATE TABLE IF NOT EXISTS property_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_featured boolean DEFAULT false,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Create Property Features (Junction Table for Tags)
CREATE TABLE IF NOT EXISTS property_features (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  feature_name text NOT NULL, -- 'Pool', 'Gym', 'Parking'
  created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_features ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Properties: View (Org scoped)
CREATE POLICY "view_org_properties" ON properties 
FOR SELECT TO authenticated 
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Properties: Manage (Org scoped)
CREATE POLICY "manage_org_properties" ON properties 
FOR ALL TO authenticated 
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Property Images: Inherit from Property
CREATE POLICY "view_property_images" ON property_images 
FOR SELECT TO authenticated 
USING (
  property_id IN (
    SELECT id FROM properties 
    WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "manage_property_images" ON property_images 
FOR ALL TO authenticated 
USING (
  property_id IN (
    SELECT id FROM properties 
    WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- Property Features: Inherit from Property
CREATE POLICY "view_property_features" ON property_features 
FOR SELECT TO authenticated 
USING (
  property_id IN (
    SELECT id FROM properties 
    WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "manage_property_features" ON property_features 
FOR ALL TO authenticated 
USING (
  property_id IN (
    SELECT id FROM properties 
    WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);
