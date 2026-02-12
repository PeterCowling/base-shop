import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  HelpCircle,
  TrendingUp,
  Users,
} from 'lucide-react';

import StaffOwnerDisabledNotice from '../../../components/security/StaffOwnerDisabledNotice';
import {
  computeBusinessScorecard,
  type MetricStatus,
  type OperatingReviewAction,
  SCORECARD_TARGETS,
} from '../../../lib/owner/businessScorecard';
import { readKpiRange } from '../../../lib/owner/kpiReader';
import { canAccessStaffOwnerRoutes } from '../../../lib/security/staffOwnerGate';

/**
 * TASK-49: Cross-app business impact scorecard page
 *
 * Unified scorecard that links guest UX engagement to reception efficiency
 * and owner-level business decisions, with KPI inputs sourced from TASK-47.
 *
 * Budget: owner_kpi_dashboard_7day (7 reads) for default view
 */
export default async function ScorecardPage() {
  if (!canAccessStaffOwnerRoutes()) {
    return <StaffOwnerDisabledNotice />;
  }

  // Fetch last 7 days of KPI data
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const kpiData = await readKpiRange(startDate, endDate);
  const scorecard = computeBusinessScorecard(kpiData);

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
              <BarChart3 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Business Impact Scorecard</h1>
              <p className="text-sm text-muted-foreground">
                Last 7 days ({startDate} to {endDate}) - {scorecard.totalGuests} guests across{' '}
                {scorecard.daysWithData} days
              </p>
            </div>
          </div>
          <Link
            href="/owner"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Dashboard
          </Link>
        </div>

        {/* Insufficient Data Warning */}
        {scorecard.hasInsufficientData && (
          <div className="mb-6 rounded-xl bg-warning-soft border-2 border-warning p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-warning-foreground mb-2">
                  Insufficient Data
                </h3>
                <p className="text-sm text-warning-foreground">
                  Insufficient data to generate scorecard. At least 3 days with guest activity are
                  required for reliable metrics. Currently: {scorecard.daysWithData} days with data.
                </p>
                <p className="text-sm text-warning-foreground mt-2">
                  Metric statuses are shown as &quot;Unknown&quot; until sufficient data is
                  available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Guest Engagement Section */}
        <div className="mb-6 rounded-xl bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Guest Engagement</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              label={SCORECARD_TARGETS.readiness.metric}
              value={scorecard.metrics.readiness.formattedValue}
              target={`Target: ${SCORECARD_TARGETS.readiness.target}${SCORECARD_TARGETS.readiness.unit}`}
              status={scorecard.metrics.readiness.status}
              description={SCORECARD_TARGETS.readiness.description}
            />
            <MetricCard
              label={SCORECARD_TARGETS.etaSubmission.metric}
              value={scorecard.metrics.etaSubmission.formattedValue}
              target={`Target: ${SCORECARD_TARGETS.etaSubmission.target}${SCORECARD_TARGETS.etaSubmission.unit}`}
              status={scorecard.metrics.etaSubmission.status}
              description={SCORECARD_TARGETS.etaSubmission.description}
            />
          </div>
        </div>

        {/* Staff Efficiency Section */}
        <div className="mb-6 rounded-xl bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold text-foreground">Staff Efficiency</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              label={SCORECARD_TARGETS.codeGeneration.metric}
              value={scorecard.metrics.codeGeneration.formattedValue}
              target={`Target: ${SCORECARD_TARGETS.codeGeneration.target}${SCORECARD_TARGETS.codeGeneration.unit}`}
              status={scorecard.metrics.codeGeneration.status}
              description={SCORECARD_TARGETS.codeGeneration.description}
            />
            <MetricCard
              label={SCORECARD_TARGETS.checkInLag.metric}
              value={scorecard.metrics.checkInLag.formattedValue}
              target={`Target: ${SCORECARD_TARGETS.checkInLag.target}${SCORECARD_TARGETS.checkInLag.unit}`}
              status={scorecard.metrics.checkInLag.status}
              description={SCORECARD_TARGETS.checkInLag.description}
            />
          </div>
        </div>

        {/* Business Impact Section */}
        <div className="mb-6 rounded-xl bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Business Impact</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              label={SCORECARD_TARGETS.supportLoad.metric}
              value={scorecard.metrics.supportLoad.formattedValue}
              target={`Target: ${SCORECARD_TARGETS.supportLoad.target}${SCORECARD_TARGETS.supportLoad.unit}`}
              status={scorecard.metrics.supportLoad.status}
              description={SCORECARD_TARGETS.supportLoad.description}
            />
            <MetricSummaryCard
              label="Total Support Requests"
              value={scorecard.totalSupportRequests.toString()}
              description="Extensions and bag drop requests across all guests"
            />
          </div>
        </div>

        {/* Weekly Operating Review */}
        <div className="mb-6 rounded-xl bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Weekly Operating Review</h2>

          {scorecard.reviewActions.length === 0 && !scorecard.hasInsufficientData && (
            <div className="rounded-lg bg-success-soft p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <p className="text-sm font-semibold text-success-foreground">All targets met</p>
              </div>
              <p className="text-sm text-success-foreground">
                All metrics are meeting or exceeding their targets. Continue current operations
                and monitor for any changes.
              </p>
            </div>
          )}

          {scorecard.reviewActions.length > 0 && (
            <div className="space-y-4">
              {scorecard.reviewActions.map((action, index) => (
                <ActionCard key={index} action={action} />
              ))}
            </div>
          )}

          {scorecard.hasInsufficientData && (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Operating review will be available once sufficient data is collected.
              </p>
            </div>
          )}
        </div>

        {/* Data Sources / Lineage */}
        <div className="mb-6 rounded-xl bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Data Sources</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg bg-muted p-4">
              <p className="font-medium text-foreground mb-2">Aggregate Node Dependency</p>
              <p className="mb-2">
                All metrics are computed from pre-aggregated{' '}
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                  ownerKpis/{'{date}'}
                </code>{' '}
                nodes (TASK-47).
              </p>
              <p>
                <strong>Budget:</strong> 1 read per day (7 reads for 7-day view), never scans raw
                bookings.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="font-medium text-foreground mb-2">Metric Lineage</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>
                  <strong>Guest Readiness:</strong> Aggregated from pre-arrival checklist
                  completion data
                </li>
                <li>
                  <strong>ETA Submission:</strong> Count of guests with confirmed arrival times
                </li>
                <li>
                  <strong>Code Generation:</strong> Bookings with automated check-in codes
                </li>
                <li>
                  <strong>Check-in Lag:</strong> Median time between expected and actual check-in
                </li>
                <li>
                  <strong>Support Load:</strong> Extension and bag drop requests per guest
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="font-medium text-foreground mb-2">Data Freshness</p>
              <p>
                KPI aggregates are updated daily by scheduled job. Scorecard reflects data as of
                the most recent aggregation run.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Link href="/" className="text-sm text-primary hover:underline">
            Return Home
          </Link>
          <Link href="/owner" className="text-sm text-primary hover:underline">
            Owner Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  target: string;
  status: MetricStatus;
  description: string;
}

function MetricCard({ label, value, target, status, description }: MetricCardProps) {
  const statusConfig = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-success" />,
      bgColor: 'bg-success-soft',
      borderColor: 'border-success',
      textColor: 'text-success-foreground',
      badge: 'Success',
      badgeBg: 'bg-success-soft',
      badgeText: 'text-success-foreground',
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-warning" />,
      bgColor: 'bg-warning-soft',
      borderColor: 'border-warning',
      textColor: 'text-warning-foreground',
      badge: 'Warning',
      badgeBg: 'bg-warning-soft',
      badgeText: 'text-warning-foreground',
    },
    unknown: {
      icon: <HelpCircle className="h-5 w-5 text-muted-foreground" />,
      bgColor: 'bg-muted',
      borderColor: 'border-border',
      textColor: 'text-foreground',
      badge: 'Unknown',
      badgeBg: 'bg-muted',
      badgeText: 'text-muted-foreground',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <span className={`rounded px-2 py-1 text-xs font-medium ${config.badgeBg} ${config.badgeText}`}>
          {config.badge}
        </span>
      </div>
      <div className={`text-2xl font-bold ${config.textColor} mb-1`}>{value}</div>
      <div className="text-xs text-muted-foreground mb-2">{target}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

interface MetricSummaryCardProps {
  label: string;
  value: string;
  description: string;
}

function MetricSummaryCard({ label, value, description }: MetricSummaryCardProps) {
  return (
    <div className="rounded-lg border-2 border-border bg-muted p-4">
      <div className="mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

interface ActionCardProps {
  action: OperatingReviewAction;
}

function ActionCard({ action }: ActionCardProps) {
  const statusConfig = {
    success: {
      bgColor: 'bg-success-soft',
      borderColor: 'border-success',
      badgeBg: 'bg-success-soft',
      badgeText: 'text-success-foreground',
    },
    warning: {
      bgColor: 'bg-warning-soft',
      borderColor: 'border-warning',
      badgeBg: 'bg-warning-soft',
      badgeText: 'text-warning-foreground',
    },
    unknown: {
      bgColor: 'bg-muted',
      borderColor: 'border-border',
      badgeBg: 'bg-muted',
      badgeText: 'text-muted-foreground',
    },
  };

  const config = statusConfig[action.status];

  return (
    <div className={`rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{action.metric}</h3>
        <span className={`rounded px-2 py-1 text-xs font-medium ${config.badgeBg} ${config.badgeText}`}>
          {action.status === 'warning' ? 'Needs Attention' : 'Unknown'}
        </span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Current:</span>{' '}
          <span className="font-semibold text-foreground">{action.currentValue}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Target:</span>{' '}
          <span className="font-semibold text-foreground">{action.targetValue}</span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-1">
          <strong>Suggested Action:</strong>
        </p>
        <p className="text-sm text-gray-800">{action.suggestedAction}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">Owner:</span>{' '}
          <span className="text-sm font-medium text-foreground">{action.owner}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Expected Impact:</span>{' '}
          <span className="text-sm font-medium text-foreground">{action.expectedImpact}</span>
        </div>
      </div>
    </div>
  );
}
