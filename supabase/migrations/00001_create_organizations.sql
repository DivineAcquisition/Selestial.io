-- 5.2 Organizations table — top-level tenant. Every client gets one row here.
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  plan_tier TEXT DEFAULT 'standard' CHECK (plan_tier IN ('standard', 'growth', 'scale')),
  onboarding_status TEXT DEFAULT 'not_started' CHECK (onboarding_status IN ('not_started', 'in_progress', 'complete', 'stalled')),
  ghl_location_id TEXT,
  ghl_api_key TEXT,
  stripe_account_id TEXT,
  telnyx_api_key TEXT,
  telnyx_phone_number TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
