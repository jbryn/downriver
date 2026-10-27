const byTestId = (id: string) => cy.get(`[data-testid="${id}"]`)

const html = () => cy.get('html')

beforeEach(() => {
  // Map tiles come from a fixture, not from OpenStreetMap
  cy.intercept('GET', 'https://tile.openstreetmap.org/**', { fixture: 'tile.png' })
})

describe('App shell', () => {
  describe('theme', () => {
    beforeEach(() => {
      cy.clearLocalStorage()
      cy.visit('/')
    })

    it('switches to the dark theme and keeps it after a reload', () => {
      byTestId('theme-dark').click()

      html().should('have.class', 'dark')
      byTestId('theme-dark').should('have.attr', 'aria-pressed', 'true')

      cy.reload()

      html().should('have.class', 'dark')
      byTestId('theme-dark').should('have.attr', 'aria-pressed', 'true')
    })

    it('switches back to the light theme', () => {
      byTestId('theme-dark').click()
      byTestId('theme-light').click()

      html().should('not.have.class', 'dark')
      cy.reload()
      html().should('not.have.class', 'dark')
    })

    it('forgets the choice when set back to automatic', () => {
      byTestId('theme-dark').click()
      byTestId('theme-system').click()

      cy.window().then((window) => {
        expect(window.localStorage.getItem('theme')).to.equal(null)
      })
    })
  })

  describe('on a wide screen', () => {
    beforeEach(() => {
      cy.viewport(1280, 800)
      cy.visit('/')
    })

    it('floats the panel over the left of a full-width map', () => {
      byTestId('side-panel').then(($panel) => {
        byTestId('map-area').then(($map) => {
          const panel = $panel[0].getBoundingClientRect()
          const map = $map[0].getBoundingClientRect()

          cy.window().then((win) => {
            expect(map.left).to.equal(0)
            expect(map.right).to.be.closeTo(win.innerWidth, 1)
          })
          // Inset 16 px from the map's edges, and as wide as the room kept clear for it
          expect(panel.left - map.left).to.be.closeTo(16, 1)
          expect(panel.top - map.top).to.be.closeTo(16, 1)
          expect(panel.right - map.left).to.be.at.most(416)
        })
      })
    })

    it('has no control for collapsing the panel', () => {
      byTestId('sheet-toggle').should('not.be.visible')
      byTestId('panel-content').should('be.visible')
    })
  })

  describe('on a phone', () => {
    beforeEach(() => {
      cy.viewport('iphone-x')
      cy.visit('/')
    })

    it('shows the panel as a sheet below the map', () => {
      byTestId('side-panel').then(($panel) => {
        byTestId('map-area').then(($map) => {
          expect($panel[0].getBoundingClientRect().top).to.be.at.least(
            $map[0].getBoundingClientRect().bottom - 1
          )
        })
      })
    })

    it('collapses and expands the sheet', () => {
      byTestId('panel-content').should('be.visible')

      byTestId('sheet-toggle').click()
      byTestId('panel-content').should('not.be.visible')
      byTestId('sheet-toggle').should('have.attr', 'aria-expanded', 'false')

      byTestId('sheet-toggle').click()
      byTestId('panel-content').should('be.visible')
    })

    it('keeps the river search usable inside the sheet', () => {
      byTestId('river-query').type('gwda')
      byTestId('river-option-8974372').click()

      byTestId('river-name').should('be.visible').and('have.text', 'Gwda')
    })
  })
})
