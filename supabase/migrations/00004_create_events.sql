-- 5.2 Events — every interaction across all tools. Activity log for webhooks from Stripe, GHL, Telnyx.
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source_system TEXT NOT NULL CHECK (source_system IN ('stripe', 'ghl', 'telnyx', 'manual', 'system')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_org ON events(org_id);
CREATE INDEX idx_events_contact ON events(contact_id);
CREATE INDEX idx_events_type ON events(org_id, event_type);
CREATE INDEX idx_events_created ON events(org_id, created_at DESC);
