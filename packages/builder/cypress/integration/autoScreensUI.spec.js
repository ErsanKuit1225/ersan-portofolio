import filterTests from "../support/filterTests"
const interact = require('../support/interact')

filterTests(['smoke', 'all'], () => {
  context("Auto Screens UI", () => {
    before(() => {
      cy.login()
      cy.deleteAllApps()
    })

    it("should disable the autogenerated screen options if no sources are available", () => {
      cy.createApp("First Test App", false)
      
      cy.closeModal();

      cy.contains("Design").click()
      cy.navigateToAutogeneratedModal()
      cy.get(interact.CONFIRM_WRAP_SPE_BUTTON).should('be.disabled')

      cy.deleteAllApps()
    });

    it("should not display incompatible sources", () => {
      cy.createApp("Test App")

      cy.selectExternalDatasource("REST")
      cy.selectExternalDatasource("S3")
      cy.get(interact.SPECTRUM_MODAL).within(() => {
        cy.get(interact.SPECTRUM_BUTTON).contains("Save and continue to query").click({ force : true })
      })
      
      cy.navigateToAutogeneratedModal()

      cy.get(interact.DATA_SOURCE_ENTRY).should('have.length', 1)
      cy.get(interact.DATA_SOURCE_ENTRY)

      cy.deleteAllApps()
    });
      
    it("should generate internal table screens", () => {
      cy.createTestApp()
      // Create Autogenerated screens from the internal table
      cy.createDatasourceScreen(["Cypress Tests"])
      // Confirm screens have been auto generated
      cy.get(interact.BODY).should('contain', "cypress-tests")
        .and('contain', 'cypress-tests/:id')
        .and('contain', 'cypress-tests/new/row')
    })

    it("should generate multiple internal table screens at once", () => {
      const initialTable = "Cypress Tests"
      const secondTable = "Table Two"
      // Create a second internal table
      cy.createTable(secondTable)
      // Create Autogenerated screens from the internal tables
      cy.createDatasourceScreen([initialTable, secondTable])
      // Confirm screens have been auto generated
      // Previously generated tables are suffixed with numbers - as expected
      cy.get(interact.BODY).should('contain', 'cypress-tests-2')
        .and('contain', 'cypress-tests-2/:id')
        .and('contain', 'cypress-tests-2/new/row')
        .and('contain', 'table-two')
        .and('contain', 'table-two/:id')
        .and('contain', 'table-two/new/row')
    })

    it("should generate multiple internal table screens with the same screen access level", () => {
      //The tables created in the previous step still exist
      cy.createTable("Table Three")
      cy.createTable("Table Four")
      cy.createDatasourceScreen(["Table Three", "Table Four"], "Admin")

      // Filter screens to Admin
      cy.filterScreensAccessLevel('Admin')

      cy.get(interact.BODY).should('contain', 'table-three')
      .and('contain', 'table-three/:id')
      .and('contain', 'table-three/new/row')
      .and('contain', 'table-four')
      .and('contain', 'table-four/:id')
      .and('contain', 'table-four/new/row')
      .and('not.contain', 'table-two')
      .and('not.contain', 'cypress-tests')
    })

    if (Cypress.env("TEST_ENV")) {
      it("should generate data source screens", () => {
        // Using MySQL data source for testing this
        const datasource = "MySQL"
        // Select & configure MySQL data source
        cy.selectExternalDatasource(datasource)
        cy.addDatasourceConfig(datasource)
        // Create Autogenerated screens from a MySQL table - MySQL contains books table
        cy.createDatasourceScreen(["books"])
        
        cy.get(interact.BODY).should('contain', 'books')
          .and('contain', 'books/:id')
          .and('contain', 'books/new/row')
      })
    }
  })
})
