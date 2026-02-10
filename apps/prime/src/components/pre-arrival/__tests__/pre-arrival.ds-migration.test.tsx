import { render } from '@testing-library/react';

import type { ReadinessLevel } from '../../../lib/preArrival';
import type { ChecklistProgress, PreArrivalData } from '../../../types/preArrival';
import AddToCalendarButton from '../AddToCalendarButton';
import CashPrep from '../CashPrep';
import ChecklistItem from '../ChecklistItem';
import EtaConfirmation from '../EtaConfirmation';
import NextActionCard from '../NextActionCard';
import ReadinessDashboard from '../ReadinessDashboard';
import ReadinessScore from '../ReadinessScore';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && Object.keys(options).length > 0) {
        return `${key}.${JSON.stringify(options)}`;
      }
      return key;
    },
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock('@acme/ui', () => ({
  ReadinessSignalCard: () => <div data-testid="readiness-signal-card" />,
  UtilityActionStrip: () => <div data-testid="utility-action-strip" />,
}));

jest.mock('../../../lib/preArrival', () => ({
  computeReadinessScore: () => 40,
  getChecklistItemLabel: (item: string) => item,
  getCompletedCount: () => 2,
  getTotalChecklistItems: () => 5,
  getNextChecklistItem: () => 'cashPrepared',
}));

jest.mock('../../../lib/analytics/activationFunnel', () => ({
  recordActivationFunnelEvent: jest.fn(),
}));

jest.mock('../../../lib/calendar', () => ({
  downloadIcs: jest.fn(),
}));

/**
 * Regex patterns for raw Tailwind palette classes.
 * These should NOT appear after DS migration.
 */
const RAW_PALETTE = {
  green: /\b(bg|text|border|from|to|stroke)-green-\d+/,
  emerald: /\b(bg|text|border|from|to)-emerald-\d+/,
  blue: /\b(bg|text|border|from|to|stroke)-blue-\d+/,
  indigo: /\b(bg|text|from|to)-indigo-\d+/,
  gray: /\b(bg|text|border|hover:bg|hover:border|stroke)-gray-\d+/,
  amber: /\b(bg|text|border|from|to|stroke)-amber-\d+/,
  slate: /\b(bg|text|border)-slate-\d+/,
  purple: /\b(bg|text|from|to)-purple-\d+/,
  violet: /\b(bg|text|from|to)-violet-\d+/,
  teal: /\b(bg|text|from|to)-teal-\d+/,
  cyan: /\b(bg|text|from|to)-cyan-\d+/,
  orange: /\b(bg|text|from|to)-orange-\d+/,
  rose: /\b(bg|text|from|to)-rose-\d+/,
  pink: /\b(bg|text|from|to)-pink-\d+/,
};

const basePreArrivalData: PreArrivalData = {
  etaWindow: null,
  etaMethod: null,
  etaNote: '',
  etaConfirmedAt: null,
  cashReadyCityTax: false,
  cashReadyDeposit: false,
  routeSaved: null,
  checklistProgress: {
    routePlanned: true,
    etaConfirmed: true,
    cashPrepared: false,
    rulesReviewed: false,
    locationSaved: false,
  },
  updatedAt: 0,
};

const allCompleteChecklist: ChecklistProgress = {
  routePlanned: true,
  etaConfirmed: true,
  cashPrepared: true,
  rulesReviewed: true,
  locationSaved: true,
};

const noneCompleteChecklist: ChecklistProgress = {
  routePlanned: false,
  etaConfirmed: false,
  cashPrepared: false,
  rulesReviewed: false,
  locationSaved: false,
};

function assertNoRawPalette(html: string, palettes: (keyof typeof RAW_PALETTE)[]) {
  for (const palette of palettes) {
    expect(html).not.toMatch(RAW_PALETTE[palette]);
  }
}

describe('Pre-arrival DS Migration', () => {
  // TC-01: ReadinessDashboard uses semantic tokens
  it('ReadinessDashboard should use semantic tokens, not raw palette classes', () => {
    const { container } = render(
      <ReadinessDashboard
        preArrivalData={basePreArrivalData}
        arrivalState="pre-arrival"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
      />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, ['blue', 'green', 'gray', 'emerald', 'indigo', 'slate']);
  });

  // TC-01b: ReadinessDashboard arrival day variant
  it('ReadinessDashboard arrival-day variant should use semantic tokens', () => {
    const { container } = render(
      <ReadinessDashboard
        preArrivalData={basePreArrivalData}
        arrivalState="arrival-day"
        checkInDate="2099-12-30"
        nights={3}
        firstName="Jane"
        cashAmounts={{ cityTax: 18, deposit: 10 }}
        onChecklistItemClick={jest.fn()}
        recentlyCompletedItem="routePlanned"
      />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, ['blue', 'green', 'gray', 'emerald', 'indigo', 'slate']);
  });

  // TC-02: CashPrep uses semantic tokens
  it('CashPrep should use semantic tokens, not raw palette classes', () => {
    const { container } = render(
      <CashPrep
        cityTaxAmount={18}
        depositAmount={10}
        onConfirm={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, ['green', 'emerald', 'blue', 'gray']);
  });

  // TC-02b: CashPrep all-ready state
  it('CashPrep all-ready state should use semantic tokens', () => {
    const { container } = render(
      <CashPrep
        cityTaxAmount={18}
        depositAmount={10}
        cityTaxReady
        depositReady
        onConfirm={jest.fn()}
      />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, ['green', 'emerald', 'blue', 'gray']);
  });

  // TC-03: EtaConfirmation uses semantic tokens
  it('EtaConfirmation should use semantic tokens, not raw palette classes', () => {
    const { container } = render(
      <EtaConfirmation
        onConfirm={jest.fn()}
        onBack={jest.fn()}
      />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, ['blue', 'gray', 'amber']);
  });

  // TC-03b: EtaConfirmation with late arrival selected
  it('EtaConfirmation with late time should use semantic tokens for warning', () => {
    const { container } = render(
      <EtaConfirmation
        currentEtaWindow="23:00"
        currentEtaMethod="ferry"
        onConfirm={jest.fn()}
      />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, ['blue', 'gray', 'amber']);
  });

  // TC-04: ChecklistItem uses semantic tokens in completed state
  it('ChecklistItem completed state should use semantic tokens', () => {
    const { container } = render(
      <ChecklistItem type="routePlanned" completed onClick={jest.fn()} />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, ['green', 'gray', 'blue']);
  });

  // TC-04b: ChecklistItem incomplete interactive state
  it('ChecklistItem incomplete interactive state should use semantic tokens', () => {
    const { container } = render(
      <ChecklistItem
        type="cashPrepared"
        completed={false}
        description="€28 cash needed"
        onClick={jest.fn()}
      />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, ['green', 'gray', 'blue']);
  });

  // TC-05: NextActionCard uses semantic tokens
  it('NextActionCard should use semantic tokens, not raw palette classes', () => {
    const { container } = render(
      <NextActionCard
        checklist={noneCompleteChecklist}
        onAction={jest.fn()}
        cashAmounts={{ cityTax: 18, deposit: 10 }}
      />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, [
      'green', 'emerald', 'blue', 'indigo', 'gray', 'slate',
      'purple', 'violet', 'amber', 'orange', 'teal', 'cyan', 'rose', 'pink',
    ]);
  });

  // TC-05b: NextActionCard all-complete state
  it('NextActionCard all-complete state should use semantic tokens', () => {
    const { container } = render(
      <NextActionCard
        checklist={allCompleteChecklist}
        onAction={jest.fn()}
      />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, [
      'green', 'emerald', 'blue', 'indigo', 'gray', 'slate',
      'purple', 'violet', 'amber', 'orange', 'teal', 'cyan', 'rose', 'pink',
    ]);
  });

  // TC-06: ReadinessScore uses semantic tokens for all levels
  const readinessLevels: ReadinessLevel[] = ['not-started', 'in-progress', 'almost-ready', 'ready'];
  const readinessScores: Record<ReadinessLevel, number> = {
    'not-started': 0,
    'in-progress': 40,
    'almost-ready': 80,
    'ready': 100,
  };

  readinessLevels.forEach((level) => {
    it(`ReadinessScore "${level}" level should use semantic tokens`, () => {
      const { container } = render(
        <ReadinessScore score={readinessScores[level]} level={level} />,
      );
      const html = container.innerHTML;
      assertNoRawPalette(html, ['green', 'blue', 'amber', 'gray', 'slate']);
    });
  });

  // TC-07: AddToCalendarButton uses semantic tokens
  it('AddToCalendarButton should use semantic tokens, not raw palette classes', () => {
    const { container } = render(
      <AddToCalendarButton
        checkInDate="2099-12-30"
        firstName="Jane"
        bookingCode="BRK-TEST"
        nights={3}
      />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html, ['gray']);
    // Should not have dark: variants with raw palette
    expect(html).not.toMatch(/dark:(bg|text|border|hover:bg)-gray-\d+/);
  });
});
