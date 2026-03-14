import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ActivityManageForm from '../ActivityManageForm';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/title/i), {
    target: { value: 'Sunset Tour' },
  });
  fireEvent.change(screen.getByLabelText(/start time/i), {
    target: { value: '2026-06-01T18:00' },
  });
  // durationMinutes defaults to 60 — leave as-is for valid form
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ success: true, id: 'new-id' }), { status: 201 }),
  );
});

// ---------------------------------------------------------------------------
// TC-03c: durationMinutes: 0 → client validation prevents fetch
// ---------------------------------------------------------------------------

test('TC-03c: submit with durationMinutes: 0 → client validation fires, no fetch call', async () => {
  render(
    <ActivityManageForm
      mode="create"
      initialValues={{ templateId: 'tpl-1' }}
      onSuccess={jest.fn()}
    />,
  );

  fillValidForm();

  // Override durationMinutes to 0 (invalid)
  fireEvent.change(screen.getByLabelText(/duration/i), {
    target: { value: '0' },
  });

  fireEvent.submit(screen.getByRole('form') ?? screen.getByText(/create activity/i).closest('form')!);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeDefined();
  });

  expect(mockFetch).not.toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// TC-03d: valid create form submit → fetch called with POST and correct body
// ---------------------------------------------------------------------------

test('TC-03d: valid create form submit → fetch called with POST and correct body shape', async () => {
  const onSuccess = jest.fn();
  render(
    <ActivityManageForm
      mode="create"
      initialValues={{ templateId: 'tpl-1' }}
      onSuccess={onSuccess}
    />,
  );

  fillValidForm();

  // Ensure durationMinutes is 60 (default)
  const durationInput = screen.getByLabelText(/duration/i);
  fireEvent.change(durationInput, { target: { value: '60' } });

  const form = screen.getByRole('form') ?? document.querySelector('form')!;
  fireEvent.submit(form);

  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
  expect(url).toBe('/api/activity-manage');
  expect(options.method).toBe('POST');

  const body = JSON.parse(options.body as string) as Record<string, unknown>;
  expect(body.title).toBe('Sunset Tour');
  expect(body.durationMinutes).toBe(60);
  expect(body.templateId).toBe('tpl-1');
  expect(typeof body.startTime).toBe('number');
});
