import { SupabaseClient } from '@supabase/supabase-js'

export async function getDashboardStats(supabase: SupabaseClient) {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, lifecycle_stage, health_status, engagement_score, ltv')

  if (!contacts) return null

  const totalContacts = contacts.length
  const activeCustomers = contacts.filter(c => c.lifecycle_stage === 'active').length
  const atRiskCount = contacts.filter(c =>
    c.health_status === 'at_risk' || c.health_status === 'critical'
  ).length
  const leads = contacts.filter(c => c.lifecycle_stage === 'lead').length
  const churned = contacts.filter(c => c.lifecycle_stage === 'churned').length
  const onboarding = contacts.filter(c => c.lifecycle_stage === 'onboarding').length

  const activeContacts = contacts.filter(c => c.lifecycle_stage === 'active')
  const totalLtv = activeContacts.reduce((sum, c) => sum + Number(c.ltv || 0), 0)
  const avgEngagement = activeContacts.length > 0
    ? Math.round(activeContacts.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / activeContacts.length)
    : 0

  const churnRate = (activeCustomers + churned) > 0
    ? Math.round((churned / (activeCustomers + churned)) * 100)
    : 0

  // Health distribution
  const healthy = contacts.filter(c => c.health_status === 'healthy').length
  const warning = contacts.filter(c => c.health_status === 'warning').length
  const atRisk = contacts.filter(c => c.health_status === 'at_risk').length
  const critical = contacts.filter(c => c.health_status === 'critical').length

  // Pipeline counts
  const pipeline = {
    lead: leads,
    onboarding,
    active: activeCustomers,
    at_risk: atRiskCount,
    churned,
    reactivated: contacts.filter(c => c.lifecycle_stage === 'reactivated').length,
  }

  return {
    totalContacts,
    activeCustomers,
    atRiskCount,
    leads,
    totalLtv,
    avgEngagement,
    churnRate,
    healthDistribution: { healthy, warning, atRisk, critical },
    pipeline,
  }
}

export async function getRecentActivity(supabase: SupabaseClient, limit = 20) {
  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      event_type,
      source_system,
      description,
      created_at,
      contacts (first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  return events || []
}

export async function getRevenueAtRisk(supabase: SupabaseClient) {
  const { data: atRiskContacts } = await supabase
    .from('contacts')
    .select('ltv')
    .in('health_status', ['at_risk', 'critical'])
    .gt('ltv', 0)

  return atRiskContacts?.reduce((sum, c) => sum + Number(c.ltv || 0), 0) || 0
}
