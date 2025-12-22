import { PreviaContainer } from '@/components/triagem/previa-container';
import type { TriagemFormData } from '@/schemas/triagemRapida.schema';

export default function TriagemPage() {
    const handleNavigateToWizard = (prefillData: TriagemFormData) => {
        // Build query params for wizard prefill
        const params = new URLSearchParams();
        params.set('prefill', 'true');
        params.set('valorFinanciado', prefillData.valorFinanciado.toString());
        params.set('prazo', prefillData.prazoMeses.toString());
        params.set('taxa', prefillData.taxaMensalContrato.toString());
        params.set('data', prefillData.dataContrato);
        params.set('tipo', prefillData.tipoContrato);

        // Navigate using window.location for client-side navigation
        window.location.href = `/novo-calculo?${params.toString()}`;
    };

    return (
        <div className="container mx-auto py-4 px-4 max-w-4xl">
            <PreviaContainer onNavigateToWizard={handleNavigateToWizard} />
        </div>
    );
}
