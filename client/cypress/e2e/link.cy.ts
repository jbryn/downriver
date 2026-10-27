import { byTestId, clickMapAt, MOUTH, openGwda, PTUSZA } from '../support/map'

const GWDA = 8974372

/** Ptusza to the mouth of the Gwda, as the app writes it after snapping both points */
const PTUSZA_TO_MOUTH = `?river=${GWDA}&from=53.36651,16.79653&to=53.05485,16.72602`

/**
 * Checks the address holds the given trip. Opening a link snaps its points onto the
 * river again, which can move them by about a meter: one in the fifth decimal.
 */
const expectAddressNear = (from: [number, number], to: [number, number], rest: string) => {
  cy.location('search').should((search) => {
    const params = new URLSearchParams(search)
    const point = (name: string) => (params.get(name) ?? '').split(',').map(Number)

    expect(params.get('river')).to.equal(String(GWDA))
    point('from').forEach((value, i) => expect(value).to.be.closeTo(from[i], 0.00002))
    point('to').forEach((value, i) => expect(value).to.be.closeTo(to[i], 0.00002))
    expect(search.endsWith(rest)).to.equal(true)
  })
}

const visitLink = (search: string) => {
  cy.intercept('GET', 'https://tile.openstreetmap.org/**', { fixture: 'tile.png' })
  cy.viewport(1280, 900)
  cy.visit(`/${search}`)
}

describe('Shareable links', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('opens the trip in a link', () => {
    visitLink(`${PTUSZA_TO_MOUTH}&unit=mi&speed=6.5`)

    byTestId('river-name').should('have.text', 'Gwda')
    // 57.81 km
    byTestId('section-length').should('have.text', '35.9 mi')
    byTestId('section-speed').should('have.text', '4.0 mph')
    byTestId('unit-mi').should('have.attr', 'aria-pressed', 'true')
    cy.get('path.section-line').should('have.length', 1)
    cy.get('.leaflet-marker-icon[title="Start"]').should('be.visible')
    cy.get('.leaflet-marker-icon[title="Finish"]').should('be.visible')
    expectAddressNear([53.36651, 16.79653], [53.05485, 16.72602], '&unit=mi&speed=6.5')
  })

  it('opens a link to a river without a section', () => {
    visitLink(`?river=${GWDA}`)

    byTestId('river-name').should('have.text', 'Gwda')
    byTestId('section-hint').should('contain.text', 'where you put in')
    cy.location('search').should('eq', `?river=${GWDA}&unit=km&speed=5`)
  })

  it('updates the address as the section changes', () => {
    openGwda()
    cy.location('search').should('eq', `?river=${GWDA}&unit=km&speed=5`)

    clickMapAt(PTUSZA)
    byTestId('section-hint').should('contain.text', 'where you take out')
    cy.location('search').should('match', /^\?river=8974372&from=[\d.]+,[\d.]+&unit=km&speed=5$/)

    clickMapAt(MOUTH)
    byTestId('section-length').should('be.visible')
    cy.location('search').should('match', /&from=[\d.]+,[\d.]+&to=[\d.]+,[\d.]+&unit=km/)

    byTestId('unit-mi').click()
    cy.location('search').should('contain', '&unit=mi&')

    byTestId('section-clear').click()
    cy.location('search').should('eq', `?river=${GWDA}&unit=mi&speed=5`)

    byTestId('change-river').click()
    cy.location('search').should('eq', '')
  })

  it('keeps the trip after a reload', () => {
    openGwda()
    clickMapAt(PTUSZA)
    byTestId('section-hint').should('contain.text', 'where you take out')
    clickMapAt(MOUTH)

    byTestId('section-length')
      .invoke('text')
      .then((length) => {
        cy.reload()

        byTestId('section-length').should('have.text', length)
      })
  })

  it('offers to copy the link once a section is set', () => {
    visitLink(PTUSZA_TO_MOUTH)

    byTestId('copy-link').should('have.text', 'Copy link')
  })

  it('shows why a river in a link cannot be opened', () => {
    visitLink('?river=999&from=53.1,16.7')

    byTestId('river-error').should('contain.text', 'River not found')
    byTestId('change-river').click()
    byTestId('river-search').should('be.visible')
    cy.location('search').should('eq', '')
  })

  it('ignores an address without a valid river', () => {
    visitLink('?river=gwda')

    byTestId('river-search').should('be.visible')
  })
})
