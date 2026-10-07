import { DashboardLayout } from '@/lib/layout';
import DashboardPage from './dashboard/page';

export default function DashboardWrapper() {
  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}
