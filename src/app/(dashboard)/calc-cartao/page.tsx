'use client';

import { useRouter } from 'next/navigation';
import { CartaoCredito } from '@/components/calculations/CartaoCredito';

export default function CalcCartaoPage() {
  const router = useRouter();

  const navigate = (route: string) => {
    router.push(`/${route}`);
  };

  return <CartaoCredito onNavigate={navigate} />;
}
