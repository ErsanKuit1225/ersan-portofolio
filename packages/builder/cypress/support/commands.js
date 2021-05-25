// ***********************************************
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//

Cypress.Commands.add("login", () => {
  cy.visit(`localhost:${Cypress.env("PORT")}/builder`)
  cy.wait(100)
  cy.url().then(url => {
    if (url.includes("builder/admin")) {
      // create admin user
      cy.get("input").first().type("test@test.com")
      cy.get('input[type="password"]').first().type("test")
      cy.get('input[type="password"]').eq(1).type("test")
      cy.contains("Create super admin user").click()
    }
    // login
    cy.contains("Sign in to Budibase").then(() => {
      cy.get("input").first().type("test@test.com")
      cy.get('input[type="password"]').type("test")
      cy.get("button").first().click()
    })
  })
})

Cypress.Commands.add("createApp", name => {
  cy.visit(`localhost:${Cypress.env("PORT")}/builder`)
  // wait for init API calls on visit
  cy.wait(100)
  cy.contains("Create app").click()
  cy.get("body").then(() => {
    cy.get(".spectrum-Modal")
      .within(() => {
        cy.get("input").eq(0).type(name).should("have.value", name).blur()
        cy.contains("Create app").click()
      })
      .then(() => {
        cy.get("[data-cy=new-table]", {
          timeout: 20000,
        }).should("be.visible")
      })
  })
})

Cypress.Commands.add("deleteApp", name => {
  cy.contains("Create your first app").then($first => {
    if ($first.length === 1) {
      return
    }
    cy.visit(`localhost:${Cypress.env("PORT")}/builder`)
    cy.get(".app").then($app => {
      cy.wait(1000)
      if ($app.find(`[data-cy="app-${name}"]`).length) {
        cy.get(`[data-cy="app-${name}"]`).contains("Open").click()
        cy.get("[data-cy=settings-icon]").click()
        cy.get(".spectrum-Dialog").within(() => {
          cy.contains("Danger Zone").click()
          cy.get("input").type("DELETE").blur()
          cy.contains("Delete Entire App").click()
        })
      }
    })
  })
})

Cypress.Commands.add("createTestApp", () => {
  const appName = "Cypress Tests"
  cy.deleteApp(appName)
  cy.createApp(appName, "This app is used for Cypress testing.")
})

Cypress.Commands.add("createTestTableWithData", () => {
  cy.createTable("dog")
  cy.addColumn("dog", "name", "Text")
  cy.addColumn("dog", "age", "Number")
})

Cypress.Commands.add("createTable", tableName => {
  // Enter table name
  cy.get("[data-cy=new-table]").click()
  cy.get(".spectrum-Modal").within(() => {
    cy.get("input").first().type(tableName).blur()
    cy.get(".spectrum-ButtonGroup").contains("Create").click()
  })
  cy.contains(tableName).should("be.visible")
})

Cypress.Commands.add("addColumn", (tableName, columnName, type) => {
  // Select Table
  cy.contains(".nav-item", tableName).click()
  cy.contains("Create column").click()

  // Configure column
  cy.get(".spectrum-Modal").within(() => {
    cy.get("input").first().type(columnName).blur()

    // Unset table display column
    cy.contains("display column").click({ force: true })
    cy.get("select").select(type)
    cy.contains("Save").click()
  })
})

Cypress.Commands.add("addRow", values => {
  cy.contains("Create row").click()
  cy.get(".spectrum-Modal").within(() => {
    for (let i = 0; i < values.length; i++) {
      cy.get("input").eq(i).type(values[i]).blur()
    }
    cy.get(".spectrum-ButtonGroup").contains("Create").click()
  })
})

Cypress.Commands.add("createUser", (email, password, role) => {
  // Create User
  cy.contains("Users").click()
  cy.contains("Create user").click()
  cy.get(".spectrum-Modal").within(() => {
    cy.get("input").first().type(email).blur()
    cy.get("input").eq(1).type(password).blur()
    cy.get("select").first().select(role)

    // Save
    cy.get(".spectrum-ButtonGroup").contains("Create User").click()
  })
})

Cypress.Commands.add("addComponent", (category, component) => {
  if (category) {
    cy.get(`[data-cy="category-${category}"]`).click()
  }
  cy.get(`[data-cy="component-${component}"]`).click()
  cy.wait(1000)
  cy.location().then(loc => {
    const params = loc.pathname.split("/")
    const componentId = params[params.length - 1]
    cy.getComponent(componentId).should("exist")
    return cy.wrap(componentId)
  })
})

Cypress.Commands.add("getComponent", componentId => {
  return cy
    .get("iframe")
    .its("0.contentDocument")
    .should("exist")
    .its("body")
    .should("not.be.null")
    .then(cy.wrap)
    .find(`[data-component-id=${componentId}]`)
})

Cypress.Commands.add("navigateToFrontend", () => {
  cy.contains("design").click()
})

Cypress.Commands.add("createScreen", (screenName, route) => {
  cy.get("[data-cy=new-screen]").click()
  cy.get(".spectrum-Modal").within(() => {
    cy.get("input").eq(0).type(screenName).blur()
    if (route) {
      cy.get("input").eq(1).type(route).blur()
    }
    cy.contains("Create Screen").click()
  })
  cy.get(".nav-items-container").within(() => {
    cy.contains(route).should("exist")
  })
})
