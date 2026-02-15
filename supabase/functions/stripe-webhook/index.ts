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
  const eventType = payload.type;

  // Find which org this Stripe event belongs to
  const stripeAccountId = payload.account || null;
  let orgId: string | null = null;

  if (stripeAccountId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("stripe_account_id", stripeAccountId)
      .single();
    orgId = org?.id || null;
  }

  // If no org found by account, try to find by customer email
  if (!orgId && payload.data?.object?.customer_email) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("org_id")
      .eq("email", payload.data.object.customer_email)
      .limit(1)
      .single();
    orgId = contact?.org_id || null;
  }

  if (!orgId) {
    return new Response(JSON.stringify({ error: "No matching org" }), { 
      status: 200 // Return 200 so Stripe doesn't retry
    });
  }

  // Find or create contact
  let contactId: string | null = null;
  const customerEmail = payload.data?.object?.customer_email 
    || payload.data?.object?.receipt_email;

  if (customerEmail) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("org_id", orgId)
      .eq("email", customerEmail)
      .single();

    if (existing) {
      contactId = existing.id;
    }
  }

  // Handle specific event types
  switch (eventType) {
    case "payment_intent.succeeded": {
      const amount = (payload.data.object.amount || 0) / 100;

      // Log event
      await supabase.from("events").insert({
        org_id: orgId,
        contact_id: contactId,
        event_type: "payment_received",
        source_system: "stripe",
        description: `Payment received: $${amount.toFixed(2)}`,
        metadata: {
          stripe_payment_intent: payload.data.object.id,
          amount,
          currency: payload.data.object.currency,
        },
      });

      // Update contact LTV
      if (contactId) {
        const { data: contact } = await supabase
          .from("contacts")
          .select("ltv")
          .eq("id", contactId)
          .single();

        await supabase
          .from("contacts")
          .update({ 
            ltv: (contact?.ltv || 0) + amount,
            last_activity_at: new Date().toISOString(),
          })
          .eq("id", contactId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      if (contactId) {
        await supabase
          .from("contacts")
          .update({ 
            lifecycle_stage: "churned",
            health_status: "critical",
          })
          .eq("id", contactId);
      }

      await supabase.from("events").insert({
        org_id: orgId,
        contact_id: contactId,
        event_type: "subscription_cancelled",
        source_system: "stripe",
        description: "Subscription cancelled",
        metadata: payload.data.object,
      });
      break;
    }

    case "charge.refunded": {
      const refundAmount = (payload.data.object.amount_refunded || 0) / 100;

      await supabase.from("events").insert({
        org_id: orgId,
        contact_id: contactId,
        event_type: "refund_issued",
        source_system: "stripe",
        description: `Refund issued: $${refundAmount.toFixed(2)}`,
        metadata: payload.data.object,
      });

      if (contactId) {
        const { data: contact } = await supabase
          .from("contacts")
          .select("ltv")
          .eq("id", contactId)
          .single();

        await supabase
          .from("contacts")
          .update({ ltv: Math.max(0, (contact?.ltv || 0) - refundAmount) })
          .eq("id", contactId);
      }
      break;
    }

    default: {
      // Log all other events generically
      await supabase.from("events").insert({
        org_id: orgId,
        contact_id: contactId,
        event_type: eventType,
        source_system: "stripe",
        description: `Stripe event: ${eventType}`,
        metadata: payload.data?.object || {},
      });
    }
  }

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
