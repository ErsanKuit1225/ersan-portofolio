import filterTests from "../../../support/filterTests"

filterTests(["all"], () => {
  context("Verify HR Template Details", () => {

    before(() => {
      cy.login()

      // Template navigation
      cy.request(`${Cypress.config().baseUrl}/api/applications?status=all`)
      .its("body")
      .then(val => {
        if (val.length > 0) {
          cy.get(".spectrum-Button").contains("Templates").click({force: true})
        }
      })

      // Filter HR Templates
      cy.get(".template-category-filters").within(() => {
        cy.get('[data-cy="HR"]').click()
      })
    })

  it("should verify the details option for HR templates", () => {
    cy.get(".template-grid").find(".template-card").its('length')
    .then(len => {
      for (let i = 0; i < len; i++) {
        cy.get(".template-card").eq(i).within(() => {
          const templateName = cy.get(".template-thumbnail-text")
          templateName.invoke('text')
          .then(templateNameText => {
            const templateNameParsed = templateNameText.toLowerCase().replace(/\s+/g, '-')

            if (templateNameText == "Job Application Tracker") {
              // Template name should include 'applicant-tracking-system'
              cy.get('a')
              .should('have.attr', 'href').and('contain', 'applicant-tracking-system')
            }
            else if (templateNameText == "Job Portal App") {
              // Template name should include 'job-portal'
              const templateNameSplit = templateNameParsed.split('-app')[0]
              cy.get('a')
              .should('have.attr', 'href').and('contain', templateNameSplit)
            }
            else {
              cy.get('a')
              .should('have.attr', 'href').and('contain', templateNameParsed)
            }
          })
          // Verify correct status from Details link - 200
          cy.get('a')
          .then(link => {
            cy.request(link.prop('href'))
            .its('status')
            .should('eq', 200)
          })
        })
      }
    })
  })
})
})
