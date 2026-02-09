import { fireEvent, render, screen } from '@testing-library/react';

import EtaConfirmation from '../EtaConfirmation';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('EtaConfirmation', () => {
  it('TC-01: renders ETA form controls', () => {
    render(
      <EtaConfirmation
        onConfirm={jest.fn()}
      />,
    );

    expect(screen.getByText('eta.title')).toBeDefined();
    expect(screen.getByRole('button', { name: '18:00' })).toBeDefined();
    expect(screen.getByText('eta.methods.bus')).toBeDefined();
  });

  it('TC-02: submits selected time window + method via onConfirm', () => {
    const onConfirm = jest.fn();
    render(
      <EtaConfirmation
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '18:00' }));
    fireEvent.click(screen.getByText('eta.methods.bus'));
    fireEvent.change(screen.getByLabelText('eta.noteLabel'), {
      target: { value: 'Running 10 mins late' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'eta.confirm' }));

    expect(onConfirm).toHaveBeenCalledWith('18:00', 'bus', 'Running 10 mins late');
  });
});
