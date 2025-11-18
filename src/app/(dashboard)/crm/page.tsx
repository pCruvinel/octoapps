'use client';

import { useRouter } from 'next/navigation';
import { CRMKanban } from '@/components/crm/CRMKanban';

export default function CRMPage() {
  const router = useRouter();

  const navigate = (route: string, id?: string) => {
    if (id) {
      router.push(`/${route}/${id}`);
    } else {
      router.push(`/${route}`);
    }
  };

  return <CRMKanban onNavigate={navigate} />;
}
