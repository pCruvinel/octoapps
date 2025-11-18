'use client';

import { useRouter, useParams } from 'next/navigation';
import { AnalisePrevia } from '@/components/calculations/AnalisePrevia';

export default function CalcAnalisePage() {
  const router = useRouter();
  const params = useParams();
  const calcId = params.id as string;

  const navigate = (route: string) => {
    router.push(`/${route}`);
  };

  return <AnalisePrevia calcId={calcId} onNavigate={navigate} />;
}
