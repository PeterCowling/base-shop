import { render, screen } from '@testing-library/react'
import { CalendarDays, MapPin, MessageCircle } from 'lucide-react'

import {
  ArrivalCodePanel,
  OwnerKpiTile,
  ReadinessSignalCard,
  StaffSignalBadgeGroup,
  UtilityActionStrip,
} from '../index'

describe('hospitality readiness suite', () => {
  it('TC-01: guest, staff, and owner composites render their state variants', () => {
    render(
      <div>
        <ReadinessSignalCard
          score={84}
          completedCount={4}
          totalCount={5}
        />
        <ArrivalCodePanel
          title="Show this at reception"
          isLoading={false}
          code="BRK-123"
          loadingLabel="Generating..."
          unavailableLabel="Unavailable"
          renderCode={(code) => <div>code:{code}</div>}
        />
        <UtilityActionStrip
          actions={[
            { id: 'maps', label: 'Maps', icon: MapPin, onSelect: jest.fn() },
            { id: 'calendar', label: 'Calendar', icon: CalendarDays, onSelect: jest.fn() },
            { id: 'support', label: 'Support', icon: MessageCircle, onSelect: jest.fn() },
          ]}
        />
        <StaffSignalBadgeGroup
          signals={[
            { id: 'eta', label: 'ETA shared', ready: true },
            { id: 'cash', label: 'Cash prepared', ready: false },
          ]}
        />
        <OwnerKpiTile
          label="Activation conversion"
          value="68%"
          description="Last 7 days"
        />
      </div>,
    )

    expect(screen.getByText('Readiness')).toBeInTheDocument()
    expect(screen.getByText('code:BRK-123')).toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Quick actions' })).toBeInTheDocument()
    expect(screen.getByLabelText('staff-signal-badges')).toBeInTheDocument()
    expect(screen.getByText('Activation conversion')).toBeInTheDocument()
  })
})
