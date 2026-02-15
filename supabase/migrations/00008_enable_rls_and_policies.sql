-- 5.3 Row-Level Security — makes multi-tenancy work.

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Helper function: get the current user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM org_members 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: users can only see their own org
CREATE POLICY "Users see own org" ON organizations
  FOR SELECT USING (id = get_user_org_id());

-- Org members: users can only see members of their org
CREATE POLICY "Users see own org members" ON org_members
  FOR SELECT USING (org_id = get_user_org_id());

-- Contacts: full CRUD scoped to org
CREATE POLICY "Users see own contacts" ON contacts
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Users insert own contacts" ON contacts
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users update own contacts" ON contacts
  FOR UPDATE USING (org_id = get_user_org_id());

-- Events: read + insert scoped to org
CREATE POLICY "Users see own events" ON events
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Users insert own events" ON events
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- Workflows: full CRUD scoped to org
CREATE POLICY "Users see own workflows" ON workflows
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Users insert own workflows" ON workflows
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users update own workflows" ON workflows
  FOR UPDATE USING (org_id = get_user_org_id());

-- Metrics: read only scoped to org
CREATE POLICY "Users see own metrics" ON metrics
  FOR SELECT USING (org_id = get_user_org_id());
