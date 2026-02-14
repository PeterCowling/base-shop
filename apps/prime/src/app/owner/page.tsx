import type { HTMLAttributes } from 'react';
import Link from 'next/link';
import { BarChart3, Clock, TrendingUp, Users } from 'lucide-react';

import StaffOwnerDisabledNotice from '../../components/security/StaffOwnerDisabledNotice';
import { readKpiRange } from '../../lib/owner/kpiReader';
import { canAccessStaffOwnerRoutes } from '../../lib/security/staffOwnerGate';

type ContainerProps = HTMLAttributes<HTMLDivElement>;
function Container(props: ContainerProps) {
  return <div {...props} />;
}

/**
 * TASK-48: Owner arrival insights dashboard
 *
 * Displays KPI feed summarizing readiness and arrival execution quality
 * backed by pre-aggregated KPI nodes from TASK-47.
 *
 * Budget: owner_kpi_dashboard_7day (7 reads) for default view
 */
export default async function OwnerPage() {
  if (!canAccessStaffOwnerRoutes()) {
    return <StaffOwnerDisabledNotice />;
  }

  // Fetch last 7 days of KPI data
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const kpiData = await readKpiRange(startDate, endDate);

  // Compute aggregated metrics across the date range
  const totalGuests = kpiData.reduce((sum, day) => sum + day.guestCount, 0);
  const daysWithData = kpiData.filter((day) => day.guestCount > 0).length;

  // Average percentages across days with data
  const avgReadiness =
    daysWithData > 0
      ? kpiData.reduce((sum, day) => sum + day.readinessCompletionPct, 0) / daysWithData
      : 0;

  const avgEtaSubmission =
    daysWithData > 0
      ? kpiData.reduce((sum, day) => sum + day.etaSubmissionPct, 0) / daysWithData
      : 0;

  const avgCodeGeneration =
    daysWithData > 0
      ? kpiData.reduce((sum, day) => sum + day.arrivalCodeGenPct, 0) / daysWithData
      : 0;

  const avgCheckInLag =
    daysWithData > 0
      ? kpiData.reduce((sum, day) => sum + day.medianCheckInLagMinutes, 0) / daysWithData
      : 0;

  const totalExtensions = kpiData.reduce((sum, day) => sum + day.extensionRequestCount, 0);
  const totalBagDrops = kpiData.reduce((sum, day) => sum + day.bagDropRequestCount, 0);

  return (
    <main className="min-h-dvh bg-muted p-4">
      <Container className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info-soft">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Owner Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Arrival insights for last 7 days ({startDate} to {endDate})
              </p>
            </div>
          </div>
          <Link
            href="/owner/setup"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent/90"
          >
            Setup
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<Users className="h-5 w-5 text-primary" />}
            label="Total Guests"
            value={totalGuests.toString()}
            bgColor="bg-info-soft"
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5 text-success" />}
            label="Average Readiness"
            value={`${Math.round(avgReadiness)}%`}
            bgColor="bg-success-soft"
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5 text-accent" />}
            label="ETA Submission"
            value={`${Math.round(avgEtaSubmission)}%`}
            bgColor="bg-accent-soft"
          />
          <KpiCard
            icon={<Clock className="h-5 w-5 text-warning" />}
            label="Check-in Lag"
            value={`${Math.round(avgCheckInLag)} min`}
            bgColor="bg-warning-soft"
          />
        </div>

        {/* Detailed Metrics */}
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Detailed Metrics</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricRow label="Code Generation Rate" value={`${Math.round(avgCodeGeneration)}%`} />
            <MetricRow label="Extension Requests" value={totalExtensions.toString()} />
            <MetricRow label="Bag Drop Requests" value={totalBagDrops.toString()} />
          </div>

          {daysWithData === 0 && (
            <div className="mt-4 rounded-lg bg-warning-soft p-4 text-center">
              <p className="text-sm text-warning-foreground">
                No guest data available for this period. KPI aggregates will appear as data is
                collected.
              </p>
            </div>
          )}
        </div>

        {/* Daily Breakdown */}
        <div className="mt-6 rounded-xl bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Daily Breakdown</h2>

          <div className="space-y-2">
            {kpiData.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-foreground">{day.date}</div>
                  <div className="text-sm text-muted-foreground">{day.guestCount} guests</div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {Math.round(day.readinessCompletionPct)}%
                    </span>{' '}
                    ready
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {Math.round(day.etaSubmissionPct)}%
                    </span>{' '}
                    ETA
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {Math.round(day.arrivalCodeGenPct)}%
                    </span>{' '}
                    codes
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {Math.round(day.medianCheckInLagMinutes)}
                    </span>{' '}
                    min lag
                  </div>
                </div>
              </div>
            ))}
          </div>

          {kpiData.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No data available for this period.</p>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Link href="/" className="text-sm text-primary hover:underline">
            Return Home
          </Link>
          <Link href="/owner/setup" className="text-sm text-primary hover:underline">
            Owner Setup
          </Link>
        </div>
      </Container>
    </main>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}

function KpiCard({ icon, label, value, bgColor }: KpiCardProps) {
  return (
    <div className={`rounded-xl ${bgColor} p-4`}>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
