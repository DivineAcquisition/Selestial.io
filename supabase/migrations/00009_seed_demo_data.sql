-- 5.5 Seed Demo Data — demo org to build against.

-- Create demo org
INSERT INTO organizations (id, name, owner_email, plan_tier, onboarding_status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Demo Company',
  'demo@selestial.io',
  'growth',
  'complete'
);

-- Create demo contacts (variety of lifecycle stages)
INSERT INTO contacts (org_id, email, first_name, last_name, lifecycle_stage, engagement_score, health_status, ltv, source, last_activity_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'sarah@example.com', 'Sarah', 'Chen', 'active', 85, 'healthy', 4500.00, 'Organic', NOW() - INTERVAL '1 day'),
('a0000000-0000-0000-0000-000000000001', 'mike@example.com', 'Mike', 'Johnson', 'active', 72, 'healthy', 3200.00, 'Referral', NOW() - INTERVAL '3 days'),
('a0000000-0000-0000-0000-000000000001', 'lisa@example.com', 'Lisa', 'Park', 'at_risk', 35, 'at_risk', 2800.00, 'Paid Ad', NOW() - INTERVAL '18 days'),
('a0000000-0000-0000-0000-000000000001', 'james@example.com', 'James', 'Wright', 'at_risk', 28, 'critical', 5100.00, 'Organic', NOW() - INTERVAL '25 days'),
('a0000000-0000-0000-0000-000000000001', 'anna@example.com', 'Anna', 'Davis', 'onboarding', 60, 'warning', 0.00, 'Outbound', NOW() - INTERVAL '2 days'),
('a0000000-0000-0000-0000-000000000001', 'tom@example.com', 'Tom', 'Rivera', 'churned', 10, 'critical', 1800.00, 'Paid Ad', NOW() - INTERVAL '45 days'),
('a0000000-0000-0000-0000-000000000001', 'emma@example.com', 'Emma', 'Scott', 'active', 91, 'healthy', 7200.00, 'Referral', NOW() - INTERVAL '1 day'),
('a0000000-0000-0000-0000-000000000001', 'david@example.com', 'David', 'Kim', 'lead', 45, 'warning', 0.00, 'Organic', NOW() - INTERVAL '5 days'),
('a0000000-0000-0000-0000-000000000001', 'rachel@example.com', 'Rachel', 'Nguyen', 'active', 68, 'warning', 2400.00, 'Partner', NOW() - INTERVAL '10 days'),
('a0000000-0000-0000-0000-000000000001', 'chris@example.com', 'Chris', 'Brown', 'reactivated', 55, 'healthy', 3600.00, 'Organic', NOW() - INTERVAL '2 days');

-- Create demo events
INSERT INTO events (org_id, contact_id, event_type, source_system, description, created_at)
SELECT 
  c.org_id,
  c.id,
  event_type,
  source_system,
  description,
  NOW() - (random() * INTERVAL '30 days')
FROM contacts c
CROSS JOIN (VALUES 
  ('email_opened', 'ghl', 'Opened onboarding email'),
  ('payment_received', 'stripe', 'Monthly subscription payment'),
  ('form_submitted', 'ghl', 'Submitted feedback form'),
  ('sms_received', 'telnyx', 'Replied to check-in SMS'),
  ('score_changed', 'system', 'Engagement score recalculated')
) AS e(event_type, source_system, description)
WHERE c.org_id = 'a0000000-0000-0000-0000-000000000001'
AND random() > 0.4;
