import { createFileRoute } from '@tanstack/react-router';
import { DocumentSettingsPage } from '@/components/settings/DocumentSettingsPage';

export const Route = createFileRoute('/_authenticated/settings/documents')({
  component: DocumentsSettingsRoute,
});

function DocumentsSettingsRoute() {
  return <DocumentSettingsPage />;
}
