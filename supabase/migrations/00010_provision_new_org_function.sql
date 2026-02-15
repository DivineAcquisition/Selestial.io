-- 5.6 Admin Provisioning Function — server-side function to create new client orgs.
CREATE OR REPLACE FUNCTION provision_new_org(
  org_name TEXT,
  owner_email TEXT,
  plan TEXT DEFAULT 'standard'
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  new_user_id UUID;
BEGIN
  -- Create the org
  INSERT INTO organizations (name, owner_email, plan_tier)
  VALUES (org_name, owner_email, plan)
  RETURNING id INTO new_org_id;
  
  -- Check if user already exists in auth
  SELECT id INTO new_user_id FROM auth.users WHERE email = owner_email;
  
  -- If user exists, link them to the new org
  IF new_user_id IS NOT NULL THEN
    INSERT INTO org_members (org_id, user_id, email, role)
    VALUES (new_org_id, new_user_id, owner_email, 'owner');
  END IF;
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage example (do not run automatically):
-- SELECT provision_new_org('Client Company Name', 'client@theircompany.com', 'growth');
