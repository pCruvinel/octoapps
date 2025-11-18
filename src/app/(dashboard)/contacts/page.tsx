'use client';

import { useRouter } from 'next/navigation';
import { ContactsList } from '@/components/contacts/ContactsList';

export default function ContactsPage() {
  const router = useRouter();

  const navigate = (route: string, id?: string) => {
    if (id) {
      router.push(`/${route}/${id}`);
    } else {
      router.push(`/${route}`);
    }
  };

  return <ContactsList onNavigate={navigate} />;
}
