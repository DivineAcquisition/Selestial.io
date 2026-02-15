'use client'

interface TimelineEvent {
  id: string
  event_type: string
  source_system: string
  description: string
  created_at: string
}

const sourceBadge: Record<string, string> = {
  stripe: 'bg-purple-50 text-purple-600 border border-purple-200',
  ghl: 'bg-blue-50 text-blue-600 border border-blue-200',
  telnyx: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  system: 'bg-[#6640FF]/5 text-[#6640FF] border border-[#9090FF]/20',
  manual: 'bg-gray-50 text-gray-500 border border-gray-200',
}

export default function EventTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Event Timeline</h3>

      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} className="flex gap-4 relative">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-[#9090FF] mt-2" />
              <div className="w-px flex-1 bg-gray-100" />
            </div>

            <div className="pb-4 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sourceBadge[event.source_system] || sourceBadge.manual}`}>
                  {event.source_system}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{event.description}</p>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No events recorded.</p>
        )}
      </div>
    </div>
  )
}
