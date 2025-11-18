'use client';

import { useRouter } from 'next/navigation';
import { EmprestimosFinanciamentos } from '@/components/calculations/EmprestimosFinanciamentos';

export default function CalcEmprestimosPage() {
  const router = useRouter();

  const navigate = (route: string) => {
    router.push(`/${route}`);
  };

  return <EmprestimosFinanciamentos onNavigate={navigate} />;
}
