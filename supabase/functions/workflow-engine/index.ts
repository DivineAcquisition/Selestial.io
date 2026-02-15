import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { contact_id, event_type, org_id } = await req.json();

  if (!org_id || !contact_id) {
    return new Response(JSON.stringify({ error: "Missing org_id or contact_id" }), { status: 400 });
  }

  // Get contact current state
  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contact_id)
    .single();

  if (!contact) {
    return new Response(JSON.stringify({ error: "Contact not found" }), { status: 404 });
  }

  // Get active workflows for this org
  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .eq("org_id", org_id)
    .eq("is_active", true);

  if (!workflows || workflows.length === 0) {
    return new Response(JSON.stringify({ triggered: 0 }), { status: 200 });
  }

  let triggered = 0;

  for (const workflow of workflows) {
    const { trigger_type, conditions, actions } = workflow;

    // Check if this event matches the workflow trigger
    let shouldFire = false;

    switch (trigger_type) {
      case "event":
        shouldFire = conditions.event_type === event_type;
        break;
      case "score_drop":
        shouldFire = event_type === "score_changed" 
          && contact.engagement_score <= (conditions.threshold || 40);
        break;
      case "health_change":
        shouldFire = contact.health_status === conditions.health_status;
        break;
      case "lifecycle_change":
        shouldFire = contact.lifecycle_stage === conditions.lifecycle_stage;
        break;
      case "inactivity":
        if (contact.last_activity_at) {
          const daysSince = (Date.now() - new Date(contact.last_activity_at).getTime()) / (24*60*60*1000);
          shouldFire = daysSince >= (conditions.days || 14);
        }
        break;
    }

    // Apply additional conditions if any
    if (shouldFire && conditions.min_ltv) {
      shouldFire = contact.ltv >= conditions.min_ltv;
    }
    if (shouldFire && conditions.lifecycle_stages) {
      shouldFire = conditions.lifecycle_stages.includes(contact.lifecycle_stage);
    }

    if (!shouldFire) continue;

    // Execute actions via centralized execute-action function
    for (const action of actions || []) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/execute-action`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action,
            org_id: org_id,
            contact_id: contact_id,
          }),
        });
      } catch (err) {
        console.error(`Action failed for workflow ${workflow.id}:`, err);
      }
    }

    // Update workflow fire count
    await supabase
      .from("workflows")
      .update({ 
        last_fired_at: new Date().toISOString(),
        fire_count: workflow.fire_count + 1,
      })
      .eq("id", workflow.id);

    triggered++;
  }

  return new Response(JSON.stringify({ triggered }), { status: 200 });
});
