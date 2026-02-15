import { createServerSupabase } from '@/lib/supabase/server'
import { getContacts } from '@/lib/queries/contacts'
import ContactList from '@/components/contacts/ContactList'

export default async function ContactsPage() {
  const supabase = await createServerSupabase()
  const contacts = await getContacts(supabase)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Contact Intelligence</h2>
      <p className="text-gray-400 text-sm mb-6">Unified view of every person in your system</p>
      <ContactList initialContacts={contacts} />
    </div>
  )
}
