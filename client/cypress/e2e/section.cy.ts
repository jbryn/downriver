import {
  byTestId,
  PTUSZA,
  MOUTH,
  PILA,
  leafletMap,
  clickMapAt,
  dragMarker,
  expectLengthNear,
  zoomOut,
  openGwda
} from '../support/map'

describe('Selecting a section', () => {
  beforeEach(openGwda)

  it('guides the user through setting a start and a finish', () => {
    byTestId('section-hint').should('contain.text', 'where you put in')

    clickMapAt(PTUSZA)
    byTestId('section-hint').should('contain.text', 'where you take out')
    cy.get('.leaflet-marker-icon[title="Start"]').should('be.visible')
    cy.get('.leaflet-marker-icon[title="Finish"]').should('not.exist')
  })

  it('measures a known stretch of the Gwda along the river', () => {
    clickMapAt(PTUSZA)
    byTestId('section-hint').should('contain.text', 'where you take out')
    clickMapAt(MOUTH)

    // 57.81 km for the exact coordinates in the API's tests; IMGW's official figure is 57.55 km
    expectLengthNear(57.8)
    byTestId('section-length').should('contain.text', ' km')
    cy.get('path.section-line').should('have.length', 1)
    cy.get('.leaflet-marker-icon[title="Finish"]').should('be.visible')
    byTestId('section-upstream').should('not.exist')
  })

  it('moves the finish when its marker is dragged', () => {
    clickMapAt(PTUSZA)
    byTestId('section-hint').should('contain.text', 'where you take out')
    clickMapAt(MOUTH)
    expectLengthNear(57.8)

    dragMarker('Finish', PILA)

    expectLengthNear(32.5)
  })

  it('warns about an upstream trip and reverses it on request', () => {
    // Set in the wrong order: the mouth first, then Ptusza
    clickMapAt(MOUTH)
    byTestId('section-hint').should('contain.text', 'where you take out')
    clickMapAt(PTUSZA)
    expectLengthNear(57.8)
    byTestId('section-upstream').should('contain.text', 'against the current')

    byTestId('section-length')
      .invoke('text')
      .then((before) => {
        byTestId('section-reverse').click()

        byTestId('section-upstream').should('not.exist')
        byTestId('section-length').should('have.text', before)
      })
  })

  it('offers no reversing for a downstream trip', () => {
    clickMapAt(PTUSZA)
    byTestId('section-hint').should('contain.text', 'where you take out')
    clickMapAt(MOUTH)
    expectLengthNear(57.8)

    byTestId('section-reverse').should('not.exist')
  })

  it('clears the selection', () => {
    clickMapAt(PTUSZA)
    byTestId('section-hint').should('contain.text', 'where you take out')
    clickMapAt(MOUTH)
    byTestId('section-length').should('be.visible')

    byTestId('section-clear').click()

    byTestId('section-hint').should('contain.text', 'where you put in')
    cy.get('path.section-line').should('not.exist')
    cy.get('.leaflet-marker-icon').should('not.exist')
  })

  it('starts a new selection on a third click', () => {
    clickMapAt(PTUSZA)
    byTestId('section-hint').should('contain.text', 'where you take out')
    clickMapAt(MOUTH)
    byTestId('section-length').should('be.visible')

    clickMapAt(PILA)

    byTestId('section-hint').should('contain.text', 'where you take out')
    cy.get('path.section-line').should('not.exist')
    cy.get('.leaflet-marker-icon[title="Finish"]').should('not.exist')
  })

  it('refuses a click far from the river and keeps what was selected', () => {
    clickMapAt(PTUSZA)
    byTestId('section-hint').should('contain.text', 'where you take out')

    // 24.5 km east of the Gwda
    zoomOut()
    leafletMap().should((map) => {
      expect(map.getBounds().contains([53.3, 17.2])).to.equal(true)
    })
    clickMapAt([53.3, 17.2])

    byTestId('section-error').should('contain.text', 'km from the river Gwda')
    byTestId('section-hint').should('contain.text', 'where you take out')
    cy.get('.leaflet-marker-icon[title="Finish"]').should('not.exist')
  })

  it('forgets the selection when another river is chosen', () => {
    clickMapAt(PTUSZA)
    byTestId('section-hint').should('contain.text', 'where you take out')

    byTestId('change-river').click()
    byTestId('river-option-34392').click()

    byTestId('section-hint').should('contain.text', 'where you put in')
    cy.get('.leaflet-marker-icon').should('not.exist')
  })
})
