'use client';

import { useRouter, useParams } from 'next/navigation';
import { ContactDetails } from '@/components/contacts/ContactDetails';

export default function ContactDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;

  const navigate = (route: string) => {
    router.push(`/${route}`);
  };

  return <ContactDetails contactId={contactId} onNavigate={navigate} />;
}
