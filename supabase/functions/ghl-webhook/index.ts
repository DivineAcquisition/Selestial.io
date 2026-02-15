import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const payload = await req.json();
  
  // GHL sends locationId which maps to our ghl_location_id
  const locationId = payload.locationId || payload.location_id;
  
  if (!locationId) {
    return new Response(JSON.stringify({ error: "No location ID" }), { status: 200 });
  }

  // Find the org
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("ghl_location_id", locationId)
    .single();

  if (!org) {
    return new Response(JSON.stringify({ error: "No matching org" }), { status: 200 });
  }

  const orgId = org.id;
  const ghlContactId = payload.contactId || payload.contact_id;
  const email = payload.email || payload.contact?.email;
  const firstName = payload.firstName || payload.contact?.firstName || payload.first_name;
  const lastName = payload.lastName || payload.contact?.lastName || payload.last_name;
  const phone = payload.phone || payload.contact?.phone;
  const eventType = payload.type || payload.event || "unknown";

  // Find or create contact
  let contactId: string | null = null;

  if (ghlContactId) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("org_id", orgId)
      .eq("ghl_contact_id", ghlContactId)
      .single();

    if (existing) {
      contactId = existing.id;
    }
  }

  // If not found by GHL ID, try email
  if (!contactId && email) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("org_id", orgId)
      .eq("email", email)
      .single();

    if (existing) {
      contactId = existing.id;
    }
  }

  // If still not found, create new contact
  if (!contactId) {
    const { data: newContact } = await supabase
      .from("contacts")
      .insert({
        org_id: orgId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        ghl_contact_id: ghlContactId,
        lifecycle_stage: "lead",
        engagement_score: 50,
        health_status: "healthy",
        last_activity_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    contactId = newContact?.id || null;
  }

  // Map GHL event types to our event types
  let mappedEventType = eventType;
  let description = `GHL event: ${eventType}`;

  switch (eventType) {
    case "ContactCreate":
      mappedEventType = "contact_created";
      description = `New contact: ${firstName} ${lastName}`;
      break;
    case "ContactUpdate":
      mappedEventType = "contact_updated";
      description = `Contact updated: ${firstName} ${lastName}`;
      break;
    case "OpportunityStatusUpdate":
      mappedEventType = "pipeline_moved";
      description = `Pipeline stage changed to: ${payload.status || payload.stage}`;
      break;
    case "FormSubmitted":
      mappedEventType = "form_submitted";
      description = `Form submitted: ${payload.formName || "unknown form"}`;
      break;
    case "NoteCreate":
      mappedEventType = "note_added";
      description = "Note added to contact";
      break;
    case "TaskCreate":
      mappedEventType = "task_created";
      description = `Task created: ${payload.title || "untitled"}`;
      break;
  }

  // Update last activity
  if (contactId) {
    await supabase
      .from("contacts")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", contactId);
  }

  // Log the event
  await supabase.from("events").insert({
    org_id: orgId,
    contact_id: contactId,
    event_type: mappedEventType,
    source_system: "ghl",
    description,
    metadata: payload,
  });

  // Trigger scoring for this contact (7.2)
  if (contactId) {
    await fetch(`${supabaseUrl}/functions/v1/scoring-engine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ contact_id: contactId }),
    });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
