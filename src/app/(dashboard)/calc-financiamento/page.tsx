'use client';

import { useRouter } from 'next/navigation';
import { FinanciamentoImobiliario } from '@/components/calculations/FinanciamentoImobiliario';

export default function CalcFinanciamentoPage() {
  const router = useRouter();

  const navigate = (route: string) => {
    router.push(`/${route}`);
  };

  return <FinanciamentoImobiliario onNavigate={navigate} />;
}
