// Fast API smoke checks via cy.request
describe('API headers smoke', { tags: ['api', 'smoke'] }, () => {
  it('GET /api/cart returns JSON', () => {
    cy.request('/api/cart').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.headers['content-type']).to.include('application/json');
      expect(res.body).to.have.property('ok', true);
      expect(res.body).to.have.property('cart');
    });
  });
});

