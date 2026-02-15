'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Command Center', href: '/dashboard', icon: '◆' },
  { label: 'Contacts', href: '/contacts', icon: '◉' },
  { label: 'Revenue', href: '/revenue', icon: '◈' },
  { label: 'Workflows', href: '/workflows', icon: '⚡' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
]

export default function Sidebar({ orgName, userEmail }: { orgName: string; userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-lg font-bold text-[#6640FF] tracking-tight">SELESTIAL</h1>
        <p className="text-xs text-gray-400 mt-1">{orgName}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#6640FF]/10 text-[#6640FF] font-medium'
                  : 'text-gray-500 hover:text-[#6640FF] hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 truncate">{userEmail}</p>
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-[#6640FF] mt-2 transition-colors"
        >
          Sign Out
        </button>
        <p className="text-[10px] text-gray-300 mt-3">Powered by <span className="text-[#9090FF] font-medium">DivineAcquisition</span></p>
      </div>
    </aside>
  )
}
