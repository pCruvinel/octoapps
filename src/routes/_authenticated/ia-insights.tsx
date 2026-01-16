import { createFileRoute } from '@tanstack/react-router';
import { AIInsightsPage } from '../../components/dashboard/AIInsightsPage';

export const Route = createFileRoute('/_authenticated/ia-insights')({
  component: AIInsightsPage,
});
