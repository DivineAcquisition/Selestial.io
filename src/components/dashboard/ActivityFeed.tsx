'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ContactRef {
  first_name: string
  last_name: string
}

interface Event {
  id: string
  event_type: string
  source_system: string
  description: string
  created_at: string
  contacts: ContactRef | ContactRef[] | null
}

const sourceBadge: Record<string, string> = {
  stripe: 'bg-purple-50 text-purple-600 border border-purple-200',
  ghl: 'bg-blue-50 text-blue-600 border border-blue-200',
  telnyx: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  system: 'bg-[#6640FF]/5 text-[#6640FF] border border-[#9090FF]/20',
  manual: 'bg-gray-50 text-gray-500 border border-gray-200',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ActivityFeed({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('events-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        async (payload) => {
          const { data } = await supabase
            .from('events')
            .select('id, event_type, source_system, description, created_at, contacts(first_name, last_name)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setEvents(prev => [data as unknown as Event, ...prev.slice(0, 19)])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 mb-4">System Activity</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.map(event => (
          <div key={event.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${sourceBadge[event.source_system] || sourceBadge.manual}`}>
              {event.source_system}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{event.description}</p>
              {event.contacts && (
                <p className="text-xs text-gray-400">
                  {Array.isArray(event.contacts)
                    ? event.contacts[0] && `${event.contacts[0].first_name} ${event.contacts[0].last_name}`
                    : `${event.contacts.first_name} ${event.contacts.last_name}`}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(event.created_at)}</span>
          </div>
        ))}

        {events.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No activity yet.</p>
        )}
      </div>
    </div>
  )
}
