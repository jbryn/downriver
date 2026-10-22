import type { Map as LeafletMap } from 'leaflet'

export const byTestId = (id: string) => cy.get(`[data-testid="${id}"]`)

export const GWDA = 8974372

/** The IMGW gauging station at Ptusza */
export const PTUSZA: [number, number] = [53.3667, 16.7964]
/** Where the Gwda joins the Noteć */
export const MOUTH: [number, number] = [53.0551, 16.726]
/** Piła, the town on the lower Gwda */
export const PILA: [number, number] = [53.151, 16.7383]

/** The Leaflet map, which the app exposes to tests in development builds */
export const leafletMap = () =>
  cy.window().its('__downriverMap') as unknown as Cypress.Chainable<LeafletMap>

/** Screen position of a coordinate, relative to the map's top-left corner */
export const pixelOf = (point: [number, number]) =>
  leafletMap().then((map) => map.latLngToContainerPoint(point))

export const clickMapAt = (point: [number, number]) => {
  pixelOf(point).then(({ x, y }) => {
    byTestId('river-map').click(x, y)
  })
}

/** Drags a marker (by its title) to a coordinate, with the mouse events Leaflet listens to */
export const dragMarker = (title: 'Start' | 'Finish', to: [number, number]) => {
  cy.get(`.leaflet-marker-icon[title="${title}"]`).then(($marker) => {
    const from = $marker[0].getBoundingClientRect()
    const startX = from.left + from.width / 2
    const startY = from.top + from.height / 2

    byTestId('river-map').then(($map) => {
      const box = $map[0].getBoundingClientRect()

      pixelOf(to).then(({ x, y }) => {
        const endX = box.left + x
        const endY = box.top + y

        // Moves go to the map element (Leaflet marks the event target during a drag), and bubble up to the document
        const moveTo = (clientX: number, clientY: number) =>
          byTestId('river-map').trigger('mousemove', { clientX, clientY, force: true })

        cy.wrap($marker).trigger('mousedown', {
          button: 0,
          which: 1,
          clientX: startX,
          clientY: startY
        })
        moveTo((startX + endX) / 2, (startY + endY) / 2)
        moveTo(endX, endY)
        byTestId('river-map').trigger('mouseup', { clientX: endX, clientY: endY, force: true })
      })
    })
  })
}

/**
 * Checks the section length shown. A click lands on a whole pixel, about 200 m apart at
 * this zoom, so the measured length can differ slightly from the one for exact coordinates.
 */
export const expectLengthNear = (kilometers: number) => {
  byTestId('section-length').should(($length) => {
    const shown = Number.parseFloat($length.text())
    expect(shown).to.be.closeTo(kilometers, 0.3)
  })
}

export const zoomOut = () => {
  cy.get('.leaflet-control-zoom-out').click()
}

/** Opens the app on a desktop screen with the Gwda shown and the map zoomed to it */
export const openGwda = () => {
  cy.intercept('GET', 'https://tile.openstreetmap.org/**', { fixture: 'tile.png' })
  cy.viewport(1280, 900)
  cy.visit('/')

  byTestId(`river-option-${GWDA}`).click()
  cy.get('path.river-line').should('exist')
  // Wait for the map to finish zooming to the river before turning coordinates into pixels
  leafletMap().should((map) => {
    expect(map.getZoom()).to.be.greaterThan(7)
  })
}
