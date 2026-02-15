import { createServerSupabase } from '@/lib/supabase/server'
import { getDashboardStats, getRecentActivity, getRevenueAtRisk } from '@/lib/queries/dashboard'
import KPICard from '@/components/dashboard/KPICard'
import HealthBar from '@/components/dashboard/HealthBar'
import PipelineSnapshot from '@/components/dashboard/PipelineSnapshot'
import ActivityFeed from '@/components/dashboard/ActivityFeed'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const stats = await getDashboardStats(supabase)
  const events = await getRecentActivity(supabase)
  const revenueAtRisk = await getRevenueAtRisk(supabase)

  if (!stats) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Command Center</h2>
        <p className="text-gray-400 text-sm">Unable to load dashboard data.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Command Center</h2>
      <p className="text-gray-400 text-sm mb-6">Real-time operational pulse</p>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Total Contacts"
          value={stats.totalContacts}
        />
        <KPICard
          label="Active Customers"
          value={stats.activeCustomers}
          color="green"
        />
        <KPICard
          label="At-Risk"
          value={stats.atRiskCount}
          subtext={`$${revenueAtRisk.toLocaleString()} revenue at risk`}
          color="red"
        />
        <KPICard
          label="Avg Engagement"
          value={stats.avgEngagement}
          subtext={`${stats.churnRate}% churn rate`}
          color="brand"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <HealthBar {...stats.healthDistribution} />
        <PipelineSnapshot pipeline={stats.pipeline} />
      </div>

      {/* Activity Feed */}
      <ActivityFeed initialEvents={events} />
    </div>
  )
}
