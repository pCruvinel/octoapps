'use client';

import { useRouter, useParams } from 'next/navigation';
import { PeticoesEditor } from '@/components/peticoes/PeticoesEditor';

export default function PeticoesEditorPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const navigate = (route: string) => {
    router.push(`/${route}`);
  };

  return <PeticoesEditor documentId={documentId} onNavigate={navigate} />;
}
