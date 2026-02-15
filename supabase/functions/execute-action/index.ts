import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { action, org_id, contact_id } = await req.json();

  // Get org config
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", org_id)
    .single();

  if (!org) {
    return new Response(JSON.stringify({ error: "Org not found" }), { status: 404 });
  }

  // Get contact
  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contact_id)
    .single();

  if (!contact) {
    return new Response(JSON.stringify({ error: "Contact not found" }), { status: 404 });
  }

  const ghlConfig = {
    apiKey: org.ghl_api_key,
    locationId: org.ghl_location_id,
  };

  const telnyxConfig = {
    apiKey: org.telnyx_api_key,
    phoneNumber: org.telnyx_phone_number,
  };

  let result: Record<string, unknown> = { success: false };

  try {
    switch (action.type) {
      case "ghl_move_pipeline": {
        if (!ghlConfig.apiKey || !contact.ghl_contact_id) break;
        const res = await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${ghlConfig.apiKey}`,
            "Content-Type": "application/json",
            "Version": "2021-07-28",
          },
          body: JSON.stringify({
            pipelineId: action.pipeline_id,
            stageId: action.stage_id,
            contactId: contact.ghl_contact_id,
            locationId: ghlConfig.locationId,
            name: `${contact.first_name} ${contact.last_name}`,
            status: "open",
          }),
        });
        result = { success: res.ok, action: "pipeline_moved" };
        break;
      }

      case "ghl_add_tag": {
        if (!ghlConfig.apiKey || !contact.ghl_contact_id) break;
        const res = await fetch(
          `https://services.leadconnectorhq.com/contacts/${contact.ghl_contact_id}/tags`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${ghlConfig.apiKey}`,
              "Content-Type": "application/json",
              "Version": "2021-07-28",
            },
            body: JSON.stringify({ tags: [action.tag] }),
          }
        );
        result = { success: res.ok, action: "tag_added", tag: action.tag };
        break;
      }

      case "ghl_create_task": {
        if (!ghlConfig.apiKey || !contact.ghl_contact_id) break;
        const dueDate = new Date(Date.now() + (action.due_days || 1) * 86400000).toISOString();
        const res = await fetch(
          `https://services.leadconnectorhq.com/contacts/${contact.ghl_contact_id}/tasks`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${ghlConfig.apiKey}`,
              "Content-Type": "application/json",
              "Version": "2021-07-28",
            },
            body: JSON.stringify({
              title: action.title || "Follow up needed",
              body: action.description || "",
              dueDate,
              completed: false,
            }),
          }
        );
        result = { success: res.ok, action: "task_created" };
        break;
      }

      case "telnyx_sms": {
        if (!telnyxConfig.apiKey || !contact.phone) break;
        const message = (action.message || "")
          .replace("{{first_name}}", contact.first_name || "")
          .replace("{{last_name}}", contact.last_name || "")
          .replace("{{email}}", contact.email || "");

        const res = await fetch("https://api.telnyx.com/v2/messages", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${telnyxConfig.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: telnyxConfig.phoneNumber,
            to: contact.phone,
            text: message,
          }),
        });
        result = { success: res.ok, action: "sms_sent" };
        break;
      }

      case "internal_alert": {
        const message = (action.message || "")
          .replace("{{first_name}}", contact.first_name || "")
          .replace("{{last_name}}", contact.last_name || "");

        await supabase.from("events").insert({
          org_id,
          contact_id,
          event_type: "workflow_alert",
          source_system: "system",
          description: message,
          metadata: { action_type: action.type },
        });
        result = { success: true, action: "alert_logged" };
        break;
      }
    }

    // Log execution result
    await supabase.from("events").insert({
      org_id,
      contact_id,
      event_type: "action_executed",
      source_system: "system",
      description: `Action ${action.type}: ${result.success ? "success" : "failed"}`,
      metadata: { action, result },
    });

  } catch (err) {
    console.error("Execution error:", err);
    result = { success: false, error: String(err) };
  }

  return new Response(JSON.stringify(result), { status: 200 });
});
