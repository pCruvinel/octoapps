import { createFileRoute } from '@tanstack/react-router';
import { OpportunityFieldsManager } from '@/components/crm/OpportunityFieldsManager';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/crm/campos-oportunidade')({
    component: CamposOportunidadePage,
});

function CamposOportunidadePage() {
    const navigate = useNavigate();

    return (
        <OpportunityFieldsManager
            onBack={() => navigate({ to: '/crm/oportunidades' })}
        />
    );
}
