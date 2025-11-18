'use client';

import { useRouter } from 'next/navigation';
import { UploadContratos } from '@/components/calculations/UploadContratos';

export default function UploadContratosPage() {
  const router = useRouter();

  const navigate = (route: string) => {
    router.push(`/${route}`);
  };

  return <UploadContratos onNavigate={navigate} />;
}
