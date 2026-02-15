'use client'

interface PipelineProps {
  pipeline: Record<string, number>
}

const stages = [
  { key: 'lead', label: 'Leads', color: 'bg-[#9090FF]' },
  { key: 'onboarding', label: 'Onboarding', color: 'bg-[#6640FF]' },
  { key: 'active', label: 'Active', color: 'bg-emerald-500' },
  { key: 'at_risk', label: 'At-Risk', color: 'bg-orange-500' },
  { key: 'churned', label: 'Churned', color: 'bg-red-500' },
  { key: 'reactivated', label: 'Reactivated', color: 'bg-purple-500' },
]

export default function PipelineSnapshot({ pipeline }: PipelineProps) {
  const max = Math.max(...Object.values(pipeline), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Pipeline</h3>
      <div className="space-y-3">
        {stages.map(stage => {
          const count = pipeline[stage.key] || 0
          const width = Math.max((count / max) * 100, 4)
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-20 text-right">{stage.label}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded flex items-center px-2`}
                  style={{ width: `${width}%` }}
                >
                  <span className="text-xs font-medium text-white">{count}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
