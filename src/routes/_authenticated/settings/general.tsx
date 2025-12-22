import { createFileRoute } from '@tanstack/react-router';
import { GeneralSettings } from '@/components/settings/GeneralSettings';

export const Route = createFileRoute('/_authenticated/settings/general')({
  component: GeneralSettingsPage,
});

function GeneralSettingsPage() {
  return <GeneralSettings />;
}
