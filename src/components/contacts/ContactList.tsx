'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Contact {
  id: string
  email: string
  first_name: string
  last_name: string
  lifecycle_stage: string
  engagement_score: number
  health_status: string
  ltv: number
  last_activity_at: string | null
}

const healthColors: Record<string, string> = {
  healthy: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-600 border border-amber-200',
  at_risk: 'bg-orange-50 text-orange-600 border border-orange-200',
  critical: 'bg-red-50 text-red-600 border border-red-200',
}

const stageColors: Record<string, string> = {
  lead: 'bg-[#9090FF]/10 text-[#6640FF] border border-[#9090FF]/20',
  onboarding: 'bg-[#6640FF]/10 text-[#6640FF] border border-[#6640FF]/20',
  active: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  at_risk: 'bg-orange-50 text-orange-600 border border-orange-200',
  churned: 'bg-red-50 text-red-600 border border-red-200',
  reactivated: 'bg-purple-50 text-purple-600 border border-purple-200',
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function ContactList({ initialContacts }: { initialContacts: Contact[] }) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [healthFilter, setHealthFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'engagement_score' | 'ltv' | 'last_activity_at'>('engagement_score')

  const filtered = useMemo(() => {
    let result = [...initialContacts]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        (c.first_name?.toLowerCase().includes(q)) ||
        (c.last_name?.toLowerCase().includes(q)) ||
        (c.email?.toLowerCase().includes(q))
      )
    }

    if (stageFilter !== 'all') {
      result = result.filter(c => c.lifecycle_stage === stageFilter)
    }

    if (healthFilter !== 'all') {
      result = result.filter(c => c.health_status === healthFilter)
    }

    result.sort((a, b) => {
      if (sortBy === 'ltv') return Number(b.ltv) - Number(a.ltv)
      if (sortBy === 'last_activity_at') {
        const aTime = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0
        const bTime = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0
        return bTime - aTime
      }
      return b.engagement_score - a.engagement_score
    })

    return result
  }, [initialContacts, search, stageFilter, healthFilter, sortBy])

  return (
    <div>
      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#6640FF] focus:ring-1 focus:ring-[#6640FF] w-64"
        />

        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600"
        >
          <option value="all">All Stages</option>
          <option value="lead">Lead</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="at_risk">At-Risk</option>
          <option value="churned">Churned</option>
          <option value="reactivated">Reactivated</option>
        </select>

        <select
          value={healthFilter}
          onChange={e => setHealthFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600"
        >
          <option value="all">All Health</option>
          <option value="healthy">Healthy</option>
          <option value="warning">Warning</option>
          <option value="at_risk">At-Risk</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'engagement_score' | 'ltv' | 'last_activity_at')}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600"
        >
          <option value="engagement_score">Sort: Score</option>
          <option value="ltv">Sort: LTV</option>
          <option value="last_activity_at">Sort: Last Active</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-3">{filtered.length} contacts</p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Stage</th>
              <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Score</th>
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Health</th>
              <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">LTV</th>
              <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(contact => (
              <tr key={contact.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/contacts/${contact.id}`} className="block">
                    <p className="text-sm text-gray-900 font-medium hover:text-[#6640FF] transition-colors">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{contact.email}</p>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stageColors[contact.lifecycle_stage] || ''}`}>
                    {contact.lifecycle_stage.replace('_', '-')}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm font-bold ${scoreColor(contact.engagement_score)}`}>
                    {contact.engagement_score}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${healthColors[contact.health_status] || ''}`}>
                    {contact.health_status.replace('_', '-')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">
                  ${Number(contact.ltv).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-400">
                  {timeAgo(contact.last_activity_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">No contacts match your filters.</p>
        )}
      </div>
    </div>
  )
}
