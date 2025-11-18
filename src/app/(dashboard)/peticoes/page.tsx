'use client';

import { useRouter } from 'next/navigation';
import { PeticoesList } from '@/components/peticoes/PeticoesList';

export default function PeticoesPage() {
  const router = useRouter();

  const navigate = (route: string, id?: string) => {
    if (id) {
      router.push(`/${route}/${id}`);
    } else {
      router.push(`/${route}`);
    }
  };

  return <PeticoesList onNavigate={navigate} />;
}
