describe('Hyperapp', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('App', () => {
    it('View mounts as #app', () => {
      cy.get('div#app h1')
    })

    it('State is rendered', () => {
      cy.get('div#app h1').should('text', '0')
    })
  })
})
