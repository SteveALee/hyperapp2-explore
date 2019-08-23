// Whilst we could import hyperapp directly into the cypress spec scripts
// we import in the HTML - largely to demonstrate how it is usually done
//
//import { app } from '../modules/hyperapp.js'
//export { h } from '../modules/hyperapp.js'
//    ;({ app, h } = win.hyperapp)
//expect(app).a('function')
//expect(h).a('function')

let app, h

// Check we can access hyperapp from the target
export const checkHyperappAccess = () => {
  cy.window({ log: false })
    .its('hyperapp.app')
    .should('be.a', 'function')
  cy.window({ log: false })
    .its('hyperapp.h')
    .should('be.a', 'function')
}

// mount the app into a new div node of id 'app'
// the node will be removed if it already exists
export const mountApp = (props, id = 'app') => {
  cy.window({ log: false }).then(win => {
    ;({ app, h } = win.hyperapp)
    const body = win.document.querySelector('body')

    const appNode = win.document.getElementById(id)
    if (appNode) {
      body.removeChild(appNode)
    }

    const newAppNode = win.document.createElement('div')
    newAppNode.id = id
    body.appendChild(newAppNode)
    app({ ...props, node: newAppNode })
  })
}

// unmount the app
export const unmountApp = (id = 'app') => {
  cy.window({ log: false }).then(win => {
    const body = win.document.querySelector('body')

    const appNode = win.document.getElementById(id)
    if (appNode) {
      body.removeChild(appNode)
    }
  })
}

export { h }
