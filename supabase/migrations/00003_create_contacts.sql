-- 5.2 Contacts — the client's customers. Every person (lead, customer, churned) lives here.
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'onboarding', 'active', 'at_risk', 'churned', 'reactivated')),
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'at_risk', 'critical')),
  ltv NUMERIC(10,2) DEFAULT 0,
  source TEXT,
  ghl_contact_id TEXT,
  stripe_customer_id TEXT,
  metadata JSONB DEFAULT '{}',
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_org ON contacts(org_id);
CREATE INDEX idx_contacts_lifecycle ON contacts(org_id, lifecycle_stage);
CREATE INDEX idx_contacts_health ON contacts(org_id, health_status);
CREATE INDEX idx_contacts_email ON contacts(org_id, email);
