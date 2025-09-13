import { ReportGenerator } from '@/components/reports/report-generator';
import { ScheduledReports } from '@/components/reports/scheduled-reports';

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reports & Analytics
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Generate comprehensive email analytics reports in PDF, Excel, or email format.
        </p>
      </div>

      <div className="space-y-8">
        <ReportGenerator />
        <ScheduledReports />
      </div>
    </div>
  );
}
