import { createFileRoute } from '@tanstack/react-router';
import { EventCategorySettings } from '../../../components/settings/EventCategorySettings';

export const Route = createFileRoute('/_authenticated/settings/event-categories')({
  component: EventCategoriesPage,
});

function EventCategoriesPage() {
  return <EventCategorySettings />;
}
