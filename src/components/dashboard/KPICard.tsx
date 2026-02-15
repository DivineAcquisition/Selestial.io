'use client'

interface KPICardProps {
  label: string
  value: string | number
  subtext?: string
  color?: 'default' | 'green' | 'red' | 'amber' | 'brand'
}

const borderMap: Record<string, string> = {
  default: 'border-gray-200',
  green: 'border-emerald-200',
  red: 'border-red-200',
  amber: 'border-amber-200',
  brand: 'border-[#9090FF]/30',
}

const valueColorMap: Record<string, string> = {
  default: 'text-gray-900',
  green: 'text-emerald-600',
  red: 'text-red-600',
  amber: 'text-amber-600',
  brand: 'text-[#6640FF]',
}

export default function KPICard({ label, value, subtext, color = 'default' }: KPICardProps) {
  return (
    <div className={`bg-white rounded-xl border ${borderMap[color]} p-5 shadow-sm`}>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColorMap[color]}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  )
}
