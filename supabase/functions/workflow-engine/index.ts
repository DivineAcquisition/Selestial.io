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

  // Get org details for API keys
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", org_id)
    .single();

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

    // Execute actions
    for (const action of actions || []) {
      try {
        switch (action.type) {
          case "ghl_move_pipeline": {
            if (org?.ghl_api_key && contact.ghl_contact_id) {
              await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${org.ghl_api_key}`,
                  "Content-Type": "application/json",
                  "Version": "2021-07-28",
                },
                body: JSON.stringify({
                  pipelineId: action.pipeline_id,
                  stageId: action.stage_id,
                  contactId: contact.ghl_contact_id,
                  locationId: org.ghl_location_id,
                  name: `${contact.first_name} ${contact.last_name}`,
                }),
              });
            }
            break;
          }

          case "ghl_add_tag": {
            if (org?.ghl_api_key && contact.ghl_contact_id) {
              await fetch(`https://services.leadconnectorhq.com/contacts/${contact.ghl_contact_id}/tags`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${org.ghl_api_key}`,
                  "Content-Type": "application/json",
                  "Version": "2021-07-28",
                },
                body: JSON.stringify({ tags: [action.tag] }),
              });
            }
            break;
          }

          case "telnyx_sms": {
            if (org?.telnyx_api_key && contact.phone) {
              await fetch("https://api.telnyx.com/v2/messages", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${org.telnyx_api_key}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: org.telnyx_phone_number,
                  to: contact.phone,
                  text: action.message
                    .replace("{{first_name}}", contact.first_name || "")
                    .replace("{{last_name}}", contact.last_name || ""),
                }),
              });
            }
            break;
          }

          case "internal_alert": {
            // Log as event for the dashboard activity feed
            await supabase.from("events").insert({
              org_id,
              contact_id,
              event_type: "workflow_alert",
              source_system: "system",
              description: action.message
                .replace("{{first_name}}", contact.first_name || "")
                .replace("{{last_name}}", contact.last_name || ""),
              metadata: { workflow_id: workflow.id, workflow_name: workflow.name },
            });
            break;
          }
        }
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
