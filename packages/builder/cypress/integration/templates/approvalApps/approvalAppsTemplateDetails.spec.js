import filterTests from "../../../support/filterTests"

filterTests(["all"], () => {
  context("Verify Aproval Apps Template Details", () => {

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

      // Filter Approval Apps Templates
      cy.get(".template-category-filters").within(() => {
        cy.get('[data-cy="Approval Apps"]').click()
      })
    })

  it("should verify the details option for Approval Apps templates", () => {
    cy.get(".template-grid").find(".template-card").its('length')
    .then(len => {
        // Verify template name is within details link
      for (let i = 0; i < len; i++) {
        cy.get(".template-card").eq(i).within(() => {
          const templateName = cy.get(".template-thumbnail-text")
          templateName.invoke('text')
          .then(templateNameText => {
            const templateNameParsed = templateNameText.toLowerCase().replace(/\s+/g, '-')
            
            if (templateNameText == "Content Approval System") {
                // Template name should include 'content-approval'
                const templateNameSplit = templateNameParsed.split('-system')[0]
                cy.get('a')
                .should('have.attr', 'href').and('contain', templateNameSplit)
            }
            else {
                cy.get('a').should('have.attr', 'href').and('contain', templateNameParsed)
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
