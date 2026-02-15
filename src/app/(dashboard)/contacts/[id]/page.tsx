import { createServerSupabase } from '@/lib/supabase/server'
import { getContactDetail } from '@/lib/queries/contacts'
import { notFound } from 'next/navigation'
import ContactProfile from '@/components/contacts/ContactProfile'
import EventTimeline from '@/components/contacts/EventTimeline'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const data = await getContactDetail(supabase, id)

  if (!data) return notFound()

  return (
    <div>
      <ContactProfile contact={data.contact} />
      <EventTimeline events={data.events} />
    </div>
  )
}
