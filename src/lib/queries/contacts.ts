import { SupabaseClient } from '@supabase/supabase-js'

export interface ContactFilters {
  search?: string
  lifecycleStage?: string
  healthStatus?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export async function getContacts(supabase: SupabaseClient, filters: ContactFilters = {}) {
  let query = supabase
    .from('contacts')
    .select('id, email, first_name, last_name, phone, lifecycle_stage, engagement_score, health_status, ltv, source, last_activity_at, created_at')

  if (filters.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  if (filters.lifecycleStage && filters.lifecycleStage !== 'all') {
    query = query.eq('lifecycle_stage', filters.lifecycleStage)
  }

  if (filters.healthStatus && filters.healthStatus !== 'all') {
    query = query.eq('health_status', filters.healthStatus)
  }

  const sortBy = filters.sortBy || 'engagement_score'
  const sortDir = filters.sortDir || 'desc'
  query = query.order(sortBy, { ascending: sortDir === 'asc' })

  const { data } = await query
  return data || []
}

export async function getContactDetail(supabase: SupabaseClient, contactId: string) {
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (!contact) return null

  const { data: events } = await supabase
    .from('events')
    .select('id, event_type, source_system, description, metadata, created_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: workflows } = await supabase
    .from('workflows')
    .select('id, name, trigger_type, is_active, last_fired_at')
    .eq('is_active', true)

  return { contact, events: events || [], workflows: workflows || [] }
}
