'use client';

import { useRouter, useParams } from 'next/navigation';
import { OpportunityDetails } from '@/components/crm/OpportunityDetails';

export default function OpportunityDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const opportunityId = params.id as string;

  const navigate = (route: string) => {
    router.push(`/${route}`);
  };

  return <OpportunityDetails opportunityId={opportunityId} onNavigate={navigate} />;
}
