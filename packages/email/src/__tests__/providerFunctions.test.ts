import { setupSegmentTest } from './segmentTestHelpers';

afterAll(() => { jest.resetModules(); jest.clearAllMocks(); });

describe('provider functions', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_MARKETING_KEY;
  });

  it('createContact returns empty string when EMAIL_PROVIDER is unset', async () => {
    setupSegmentTest();
    const { createContact } = await import('../segments');
    await expect(createContact('a@example.com')).resolves.toBe('');
  });

  it('addToList resolves when EMAIL_PROVIDER is unset', async () => {
    setupSegmentTest();
    const { addToList } = await import('../segments');
    await expect(addToList('c1', 'l1')).resolves.toBeUndefined();
  });

  it('listSegments returns empty array when EMAIL_PROVIDER is unset', async () => {
    setupSegmentTest();
    const { listSegments } = await import('../segments');
    await expect(listSegments()).resolves.toEqual([]);
  });

  it('createContact calls fetch with marketing key when API key missing', async () => {
    setupSegmentTest();
    jest.unmock('../providers/sendgrid');
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ persisted_recipients: ['id1'] }),
    }) as any;
    process.env.EMAIL_PROVIDER = 'sendgrid';
    process.env.SENDGRID_MARKETING_KEY = 'mk';
    delete process.env.SENDGRID_API_KEY;
    const { createContact } = await import('../segments');
    await createContact('user@example.com');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('createContact returns empty string when provider lacks createContact', async () => {
    setupSegmentTest();
    jest.doMock('../providers/sendgrid', () => ({
      SendgridProvider: class {
        addToList = jest.fn();
        listSegments = jest.fn().mockResolvedValue([]);
      },
    }));
    process.env.EMAIL_PROVIDER = 'sendgrid';
    const { createContact } = await import('../segments');
    await expect(createContact('user@example.com')).resolves.toBe('');
  });

  it('addToList resolves when provider only implements createContact', async () => {
    setupSegmentTest();
    jest.doMock('../providers/sendgrid', () => ({
      SendgridProvider: class {
        createContact = jest.fn().mockResolvedValue('contact-1');
      },
    }));
    process.env.EMAIL_PROVIDER = 'sendgrid';
    const { createContact, addToList } = await import('../segments');
    const id = await createContact('user@example.com');
    await expect(addToList(id, 'l1')).resolves.toBeUndefined();
  });

  it('listSegments returns empty array when provider lacks listSegments', async () => {
    setupSegmentTest();
    jest.doMock('../providers/sendgrid', () => ({
      SendgridProvider: class {
        createContact = jest.fn().mockResolvedValue('contact-1');
        addToList = jest.fn();
      },
    }));
    process.env.EMAIL_PROVIDER = 'sendgrid';
    const { listSegments } = await import('../segments');
    await expect(listSegments()).resolves.toEqual([]);
  });

  it('delegates to configured provider', async () => {
    setupSegmentTest();
    const createContactImpl = jest.fn().mockResolvedValue('contact-1');
    const addToListImpl = jest.fn().mockResolvedValue(undefined);
    const listSegmentsImpl = jest.fn().mockResolvedValue([
      { id: 's1', name: 'All' },
    ]);
    jest.doMock('../providers/sendgrid', () => ({
      SendgridProvider: class {
        createContact = createContactImpl;
        addToList = addToListImpl;
        listSegments = listSegmentsImpl;
      },
    }));
    process.env.EMAIL_PROVIDER = 'sendgrid';
    const { createContact, addToList, listSegments } = await import(
      '../segments'
    );
    const id = await createContact('user@example.com');
    await addToList(id, 'list1');
    const segments = await listSegments();
    expect(id).toBe('contact-1');
    expect(createContactImpl).toHaveBeenCalledWith('user@example.com');
    expect(addToListImpl).toHaveBeenCalledWith('contact-1', 'list1');
    expect(segments).toEqual([{ id: 's1', name: 'All' }]);
  });

  it('createContact returns empty string when Sendgrid provider throws', async () => {
    setupSegmentTest();
    jest.doMock('../providers/sendgrid', () => ({
      SendgridProvider: class {
        createContact = jest.fn(() => {
          throw new Error('sendgrid createContact');
        });
        addToList = jest.fn();
        listSegments = jest.fn();
      },
    }));
    process.env.EMAIL_PROVIDER = 'sendgrid';
    const { createContact } = await import('../segments');
    await expect(createContact('user@example.com')).resolves.toBe('');
  });

  it('addToList resolves when Sendgrid provider throws', async () => {
    setupSegmentTest();
    jest.doMock('../providers/sendgrid', () => ({
      SendgridProvider: class {
        createContact = jest.fn().mockResolvedValue('contact-1');
        addToList = jest.fn(() => {
          throw new Error('sendgrid addToList');
        });
        listSegments = jest.fn();
      },
    }));
    process.env.EMAIL_PROVIDER = 'sendgrid';
    const { addToList } = await import('../segments');
    await expect(addToList('c1', 'l1')).resolves.toBeUndefined();
  });

  it('listSegments returns empty array when Sendgrid provider throws', async () => {
    setupSegmentTest();
    jest.doMock('../providers/sendgrid', () => ({
      SendgridProvider: class {
        createContact = jest.fn();
        addToList = jest.fn();
        listSegments = jest.fn(() => {
          throw new Error('sendgrid listSegments');
        });
      },
    }));
    process.env.EMAIL_PROVIDER = 'sendgrid';
    const { listSegments } = await import('../segments');
    await expect(listSegments()).resolves.toEqual([]);
  });

  it('createContact returns empty string when Resend provider throws', async () => {
    setupSegmentTest();
    jest.doMock('../providers/resend', () => ({
      ResendProvider: class {
        createContact = jest.fn(() => {
          throw new Error('resend createContact');
        });
        addToList = jest.fn();
        listSegments = jest.fn();
      },
    }));
    process.env.EMAIL_PROVIDER = 'resend';
    const { createContact } = await import('../segments');
    await expect(createContact('user@example.com')).resolves.toBe('');
  });

  it('addToList resolves when Resend provider throws', async () => {
    setupSegmentTest();
    jest.doMock('../providers/resend', () => ({
      ResendProvider: class {
        createContact = jest.fn().mockResolvedValue('contact-1');
        addToList = jest.fn(() => {
          throw new Error('resend addToList');
        });
        listSegments = jest.fn();
      },
    }));
    process.env.EMAIL_PROVIDER = 'resend';
    const { addToList } = await import('../segments');
    await expect(addToList('c1', 'l1')).resolves.toBeUndefined();
  });

  it('listSegments returns empty array when Resend provider throws', async () => {
    setupSegmentTest();
    jest.doMock('../providers/resend', () => ({
      ResendProvider: class {
        createContact = jest.fn();
        addToList = jest.fn();
        listSegments = jest.fn(() => {
          throw new Error('resend listSegments');
        });
      },
    }));
    process.env.EMAIL_PROVIDER = 'resend';
    const { listSegments } = await import('../segments');
    await expect(listSegments()).resolves.toEqual([]);
  });

  it('returns empty list for unknown provider', async () => {
    setupSegmentTest();
    process.env.EMAIL_PROVIDER = 'unknown';
    const { listSegments } = await import('../segments');
    await expect(listSegments()).resolves.toEqual([]);
  });
});
