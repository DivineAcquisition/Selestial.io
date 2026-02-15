-- 7.6 Seed Demo Workflows — automation rules to test and demo on the dashboard.
INSERT INTO workflows (org_id, name, trigger_type, conditions, actions, is_active) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'At-Risk Rescue',
  'health_change',
  '{"health_status": "at_risk"}',
  '[{"type": "ghl_add_tag", "tag": "at-risk-flagged"}, {"type": "internal_alert", "message": "{{first_name}} {{last_name}} flagged at-risk. Rescue sequence starting."}]',
  true
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Speed-to-Lead Alert',
  'event',
  '{"event_type": "contact_created"}',
  '[{"type": "internal_alert", "message": "New lead: {{first_name}} {{last_name}}. Follow up immediately."}]',
  true
),
(
  'a0000000-0000-0000-0000-000000000001',
  'Churn Prevention SMS',
  'score_drop',
  '{"threshold": 30, "lifecycle_stages": ["active", "at_risk"]}',
  '[{"type": "telnyx_sms", "message": "Hey {{first_name}}, just checking in. Want to make sure everything is working well for you. Reply if you need anything."}, {"type": "internal_alert", "message": "Churn prevention SMS sent to {{first_name}} {{last_name}} (score dropped below 30)."}]',
  true
),
(
  'a0000000-0000-0000-0000-000000000001',
  'High-Value Recovery',
  'health_change',
  '{"health_status": "critical", "min_ltv": 3000}',
  '[{"type": "ghl_add_tag", "tag": "high-value-at-risk"}, {"type": "internal_alert", "message": "HIGH PRIORITY: {{first_name}} {{last_name}} (LTV: $3000+) is critical. Personal outreach needed immediately."}]',
  true
);
