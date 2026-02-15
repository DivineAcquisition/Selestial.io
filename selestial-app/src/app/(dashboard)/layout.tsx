import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get org info
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(name)')
    .eq('user_id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orgName = (membership?.organizations as any)?.name || 'Selestial'

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar orgName={orgName} userEmail={user.email || ''} />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
