'use client'

import Link from 'next/link'

interface Contact {
  first_name: string
  last_name: string
  email: string
  phone: string
  lifecycle_stage: string
  engagement_score: number
  health_status: string
  ltv: number
  source: string
  last_activity_at: string
  created_at: string
}

const healthColors: Record<string, string> = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-400',
  at_risk: 'bg-orange-500',
  critical: 'bg-red-500',
}

const healthLabels: Record<string, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  at_risk: 'At Risk',
  critical: 'Critical',
}

export default function ContactProfile({ contact }: { contact: Contact }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/contacts" className="text-xs text-[#6640FF] hover:underline mb-2 inline-block">&larr; Back to contacts</Link>
          <h2 className="text-xl font-bold text-gray-900">
            {contact.first_name} {contact.last_name}
          </h2>
          <p className="text-sm text-gray-400">{contact.email}</p>
          {contact.phone && <p className="text-sm text-gray-400">{contact.phone}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${healthColors[contact.health_status]}`} />
          <span className="text-sm text-gray-500">
            {healthLabels[contact.health_status] || contact.health_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Stage</p>
          <p className="text-sm text-gray-900 capitalize font-medium">{contact.lifecycle_stage.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Engagement Score</p>
          <p className="text-lg font-bold text-[#6640FF]">{contact.engagement_score}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Lifetime Value</p>
          <p className="text-sm text-gray-900 font-medium">${Number(contact.ltv).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Source</p>
          <p className="text-sm text-gray-900">{contact.source || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Last Active</p>
          <p className="text-sm text-gray-900">
            {contact.last_activity_at
              ? new Date(contact.last_activity_at).toLocaleDateString()
              : 'Never'}
          </p>
        </div>
      </div>
    </div>
  )
}
