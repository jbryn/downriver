import { byTestId, clickMapAt, MOUTH, openGwda, PTUSZA } from '../support/map'

/** Selects Ptusza to the mouth of the Gwda, about 57.8 km */
const selectPtuszaToMouth = () => {
  clickMapAt(PTUSZA)
  byTestId('section-hint').should('contain.text', 'Click the river again')
  clickMapAt(MOUTH)
  byTestId('section-length').should('be.visible')
}

/** Minutes in a duration such as "11 h 35 min" or "45 min" */
const minutesIn = (text: string) => {
  const hours = /(\d+) h/.exec(text)
  const minutes = /(\d+) min/.exec(text)
  return Number(hours?.[1] ?? 0) * 60 + Number(minutes?.[1] ?? 0)
}

/**
 * Checks the paddling time shown. Clicks land on whole pixels, so the length can be
 * up to 0.3 km off, which moves the time by a few minutes either way.
 */
const expectDurationNear = (minutes: number, tolerance: number) => {
  byTestId('section-duration').should(($duration) => {
    expect(minutesIn($duration.text())).to.be.closeTo(minutes, tolerance)
  })
}

describe('Trip details', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    openGwda()
  })

  it('estimates the paddling time and updates it with the speed', () => {
    selectPtuszaToMouth()

    // 57.8 km at 5 km/h is 694 minutes
    byTestId('section-speed').should('have.text', '5.0 km/h')
    expectDurationNear(694, 10)

    // A range input only reacts to its value changing and an input event
    byTestId('speed-input').invoke('val', 10).trigger('input')

    byTestId('section-speed').should('have.text', '10.0 km/h')
    expectDurationNear(347, 10)
  })

  it('lists the obstacles and access points on the section, and marks them on the map', () => {
    selectPtuszaToMouth()

    // Four weirs and two dams, all at least 3.5 km from either end
    byTestId('section-features-summary').should('contain.text', '6 obstacles')
    byTestId('section-feature-obstacle').should('have.length', 6)
    byTestId('section-feature-obstacle').first().should('contain.text', 'Dam')
    byTestId('section-features').should('contain.text', 'Most Władysława Łokietka')

    cy.get('path.feature-obstacle').should('have.length', 6)
    byTestId('section-feature-access').then(($rows) => {
      cy.get('path.feature-access').should('have.length', $rows.length)
    })
  })

  it('removes the markers when the selection is cleared', () => {
    selectPtuszaToMouth()
    cy.get('path.feature-marker').should('have.length.greaterThan', 0)

    byTestId('section-clear').click()

    cy.get('path.feature-marker').should('not.exist')
  })

  it('switches every distance to miles, and remembers the choice', () => {
    selectPtuszaToMouth()

    byTestId('unit-mi').click()

    byTestId('river-length').should('have.text', '88.8 mi')
    byTestId('section-length').should('contain.text', ' mi')
    byTestId('section-speed').should('have.text', '3.1 mph')
    byTestId('section-features').find('li').first().should('contain.text', ' mi')

    cy.reload()
    byTestId('unit-mi').should('have.attr', 'aria-pressed', 'true')
  })
})
