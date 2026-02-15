import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EVENT_WEIGHTS: Record<string, number> = {
  payment_received: 10,
  form_submitted: 5,
  sms_received: 4,
  call_completed: 6,
  email_opened: 2,
  login: 3,
  contact_updated: 1,
  pipeline_moved: 3,
  support_ticket: -2,
  subscription_cancelled: -20,
  refund_issued: -15,
};

function getRecencyMultiplier(daysAgo: number): number {
  if (daysAgo <= 7) return 1.0;
  if (daysAgo <= 14) return 0.75;
  if (daysAgo <= 30) return 0.5;
  return 0.25;
}

function getInactivityPenalty(daysSinceLastActivity: number): number {
  if (daysSinceLastActivity <= 7) return 0;
  if (daysSinceLastActivity <= 14) return -5;
  if (daysSinceLastActivity <= 30) return -15;
  return -30;
}

function getHealthStatus(score: number, daysSinceActivity: number): string {
  if (score >= 70 && daysSinceActivity <= 7) return "healthy";
  if (score >= 40 && daysSinceActivity <= 14) return "warning";
  if (score >= 20 || daysSinceActivity <= 30) return "at_risk";
  return "critical";
}

function getLifecycleStage(currentStage: string, healthStatus: string): string {
  // Don't change lead or onboarding stages based on scoring
  if (currentStage === "lead" || currentStage === "onboarding") return currentStage;
  // Don't override reactivated for first 14 days
  if (currentStage === "reactivated") return currentStage;
  
  if (healthStatus === "critical") return "at_risk";
  if (healthStatus === "at_risk" && currentStage === "active") return "at_risk";
  if (healthStatus === "healthy" && currentStage === "at_risk") return "active";
  
  return currentStage;
}

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const body = await req.json().catch(() => ({}));
  
  // Can score a single contact or all contacts in an org
  const { contact_id, org_id } = body;

  let contacts;

  if (contact_id) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contact_id);
    contacts = data;
  } else if (org_id) {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("org_id", org_id)
      .in("lifecycle_stage", ["active", "at_risk", "onboarding", "reactivated"]);
    contacts = data;
  } else {
    // Score ALL contacts across all orgs (for daily cron)
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .in("lifecycle_stage", ["active", "at_risk", "onboarding", "reactivated"]);
    contacts = data;
  }

  if (!contacts || contacts.length === 0) {
    return new Response(JSON.stringify({ scored: 0 }), { status: 200 });
  }

  const now = new Date();
  let scored = 0;

  for (const contact of contacts) {
    // Get events from last 60 days
    const { data: events } = await supabase
      .from("events")
      .select("event_type, created_at")
      .eq("contact_id", contact.id)
      .gte("created_at", new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    // Calculate base score from events
    let rawScore = 50; // Start at neutral
    for (const event of events || []) {
      const weight = EVENT_WEIGHTS[event.event_type] || 1;
      const daysAgo = (now.getTime() - new Date(event.created_at).getTime()) / (24 * 60 * 60 * 1000);
      const multiplier = getRecencyMultiplier(daysAgo);
      rawScore += weight * multiplier;
    }

    // Apply inactivity penalty
    const lastActivity = contact.last_activity_at ? new Date(contact.last_activity_at) : new Date(contact.created_at);
    const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000);
    rawScore += getInactivityPenalty(daysSinceActivity);

    // Clamp to 0–100
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
    const healthStatus = getHealthStatus(finalScore, daysSinceActivity);
    const lifecycleStage = getLifecycleStage(contact.lifecycle_stage, healthStatus);

    // Only update if something changed
    if (
      finalScore !== contact.engagement_score ||
      healthStatus !== contact.health_status ||
      lifecycleStage !== contact.lifecycle_stage
    ) {
      await supabase
        .from("contacts")
        .update({
          engagement_score: finalScore,
          health_status: healthStatus,
          lifecycle_stage: lifecycleStage,
        })
        .eq("id", contact.id);

      // Log score change as event
      if (Math.abs(finalScore - contact.engagement_score) >= 5) {
        await supabase.from("events").insert({
          org_id: contact.org_id,
          contact_id: contact.id,
          event_type: "score_changed",
          source_system: "system",
          description: `Score: ${contact.engagement_score} → ${finalScore} | Health: ${healthStatus}`,
          metadata: {
            previous_score: contact.engagement_score,
            new_score: finalScore,
            health_status: healthStatus,
            lifecycle_stage: lifecycleStage,
          },
        });
      }

      // Trigger workflow engine on significant score changes (7.5)
      if (Math.abs(finalScore - contact.engagement_score) >= 5 || healthStatus !== contact.health_status) {
        await fetch(`${supabaseUrl}/functions/v1/workflow-engine`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            contact_id: contact.id,
            org_id: contact.org_id,
            event_type: "score_changed",
          }),
        });
      }

      scored++;
    }
  }

  return new Response(JSON.stringify({ scored, total: contacts.length }), { status: 200 });
});
