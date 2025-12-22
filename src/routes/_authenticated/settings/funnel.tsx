import { createFileRoute } from '@tanstack/react-router';
import { FunnelSettings } from '@/components/settings/FunnelSettings';

export const Route = createFileRoute('/_authenticated/settings/funnel')({
    component: FunnelSettingsPage,
});

function FunnelSettingsPage() {
    return <FunnelSettings />;
}
