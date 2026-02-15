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
  const eventData = payload.data;
  const eventType = eventData?.event_type;

  // Telnyx sends the phone number — find org by telnyx_phone_number
  const toNumber = eventData?.payload?.to?.[0]?.phone_number 
    || eventData?.payload?.to;
  const fromNumber = eventData?.payload?.from?.phone_number 
    || eventData?.payload?.from;

  // Try to find org by the Telnyx number (could be to or from)
  let orgId: string | null = null;

  for (const num of [toNumber, fromNumber]) {
    if (num) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("telnyx_phone_number", num)
        .single();
      if (org) {
        orgId = org.id;
        break;
      }
    }
  }

  if (!orgId) {
    return new Response(JSON.stringify({ error: "No matching org" }), { status: 200 });
  }

  // Find contact by phone number
  const contactPhone = eventType?.includes("inbound") ? fromNumber : toNumber;
  let contactId: string | null = null;

  if (contactPhone) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("org_id", orgId)
      .eq("phone", contactPhone)
      .single();
    contactId = contact?.id || null;
  }

  let mappedEventType = eventType;
  let description = `Telnyx event: ${eventType}`;

  if (eventType === "message.received") {
    mappedEventType = "sms_received";
    description = `SMS received from ${fromNumber}`;
  } else if (eventType === "message.sent") {
    mappedEventType = "sms_sent";
    description = `SMS sent to ${toNumber}`;
  } else if (eventType === "call.answered") {
    mappedEventType = "call_connected";
    description = `Call connected with ${contactPhone}`;
  } else if (eventType === "call.hangup") {
    mappedEventType = "call_completed";
    const duration = eventData?.payload?.duration_secs || 0;
    description = `Call completed (${duration}s)`;
  }

  // Update last activity
  if (contactId) {
    await supabase
      .from("contacts")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", contactId);
  }

  // Log event
  await supabase.from("events").insert({
    org_id: orgId,
    contact_id: contactId,
    event_type: mappedEventType,
    source_system: "telnyx",
    description,
    metadata: eventData?.payload || {},
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
