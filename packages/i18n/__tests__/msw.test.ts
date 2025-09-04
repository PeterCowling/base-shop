import { server } from '../../../test/msw/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('msw default handlers', () => {
  test('POST /cms/api/configurator', async () => {
    const res = await fetch('http://localhost/cms/api/configurator', {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true, message: 'default handler: OK' });
  });

  test('GET /cms/api/configurator/validate-env/:shop', async () => {
    const res = await fetch(
      'http://localhost/cms/api/configurator/validate-env/my-shop'
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
  });

  test('GET /cms/api/page-templates', async () => {
    const res = await fetch('http://localhost/cms/api/page-templates');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });
});
