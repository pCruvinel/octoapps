'use client';

import { useRouter } from 'next/navigation';
import { CalculationsList } from '@/components/calculations/CalculationsList';

export default function CalculationsPage() {
  const router = useRouter();

  const navigate = (route: string, id?: string) => {
    if (id) {
      router.push(`/${route}/${id}`);
    } else {
      router.push(`/${route}`);
    }
  };

  return <CalculationsList onNavigate={navigate} />;
}
