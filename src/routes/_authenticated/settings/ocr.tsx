import { createFileRoute } from '@tanstack/react-router';
import { OCRSettingsPage } from '@/components/settings/OCRSettingsPage';

export const Route = createFileRoute('/_authenticated/settings/ocr')({
  component: OCRSettingsRoute,
});

function OCRSettingsRoute() {
  return <OCRSettingsPage />;
}
