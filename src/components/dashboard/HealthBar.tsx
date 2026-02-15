'use client'

interface HealthBarProps {
  healthy: number
  warning: number
  atRisk: number
  critical: number
}

export default function HealthBar({ healthy, warning, atRisk, critical }: HealthBarProps) {
  const total = healthy + warning + atRisk + critical
  if (total === 0) return null

  const pct = (n: number) => Math.round((n / total) * 100)

  const segments = [
    { label: 'Healthy', count: healthy, pct: pct(healthy), color: 'bg-emerald-500', dot: 'bg-emerald-500' },
    { label: 'Warning', count: warning, pct: pct(warning), color: 'bg-amber-400', dot: 'bg-amber-400' },
    { label: 'At-Risk', count: atRisk, pct: pct(atRisk), color: 'bg-orange-500', dot: 'bg-orange-500' },
    { label: 'Critical', count: critical, pct: pct(critical), color: 'bg-red-500', dot: 'bg-red-500' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Health Distribution</h3>

      <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-gray-100">
        {segments.map(s => s.pct > 0 && (
          <div key={s.label} className={`${s.color}`} style={{ width: `${s.pct}%` }} />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {segments.map(s => (
          <div key={s.label} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{s.count}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
