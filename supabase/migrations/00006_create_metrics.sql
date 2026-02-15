-- 5.2 Metrics — pre-computed dashboard numbers. Cron job writes here daily.
CREATE TABLE metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  period TEXT,
  metadata JSONB DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_org ON metrics(org_id, metric_type);
CREATE INDEX idx_metrics_period ON metrics(org_id, period);
