import { createFileRoute } from '@tanstack/react-router';
import { SalesDashboard } from '@/components/crm/SalesDashboard';

export const Route = createFileRoute('/_authenticated/crm/dashboard')({
  component: DashboardCRMPage,
});

function DashboardCRMPage() {
  return (
    <div className="p-4 lg:p-8">
      <SalesDashboard />
    </div>
  );
}
