import {
  checkHyperappAccess,
  mountApp,
  unmountApp,
  h,
} from '../modules/mount-app.js'
import { haveElementText } from '../modules/node-text.js'

const getAppRoot = () => cy.get('div#app', { log: false })

// View functions map state to VNODEs which are rendered to the DOM by hyperapp
describe('View', () => {
  beforeEach(() => {
    cy.visit('/', { log: false })
  })

  it('Cypress code can access hyperapp.h in html', () => {
    checkHyperappAccess()
  })

  it('View mounts as specified node', () => {
    mountApp({
      view: () => h('div', {}, 'view text'),
      node: '#app',
    })

    cy.contains('view text').should('have.attr', 'id', 'app')
  })

  // Hyperscript (h function) is the base access stype to the VDOM
  // Tools such as JSX and hyperx build on hyperscript
  it('Hyperscript h() renders correctly', () => {
    // h(node, {props}, [children|text])
    // key is special prop for identifying VNODEs when reordering
    mountApp({
      view: () =>
        h('div', { 'data-foo': 'bar', keys: '1' }, [
          'text',
          h('p', { class: 'hook' }, 'para 1'),
          h('p', { class: { on: true, off: false } }, 'para 2'),
          h('p', { style: { fontSize: '20px' } }, 'para 3'),
        ]),
    })

    getAppRoot()
      .should('have.attr', 'data-foo', 'bar')
      .should(div => expect(div.attr('key'), 'key attrib').to.be.undefined)
      .should(haveElementText('text'))
    getAppRoot()
      .contains('para 1')
      .should('have.class', 'hook')
    getAppRoot()
      .contains('para 2')
      .should('have.class', 'on')
      .should('not.have.class', 'off')
    getAppRoot()
      .contains('para 3')
      .should('has.css', 'fontSize', '20px')
  })

  // Component functions map props to VNODEs
  it('Component is passed props and rendered', () => {
    const Component = ({ text }) => {
      return h('p', {}, `component: ${text}`)
    }

    mountApp({
      view: () => h('div', {}, [h('h1', {}, Component({ text: 'a prop' }))]),
      node: '#app',
    })

    cy.get('div#app h1').contains('component: a prop')
  })

  // Compmnents als accept an array of child VNodes
  it('Component is passed children and rendered', () => {
    const Component = children => {
      return h('div', {}, children)
    }

    mountApp({
      view: () =>
        h('div', {}, [
          Component([h('p', {}, 'child 1'), h('p', {}, 'child 2')]),
        ]),
      node: '#app',
    })

    cy.get('div p').each((el, i) => expect(el).text(`child ${i + 1}`))
  })
})

// Hyperapp has a single state atom
describe('State', () => {
  beforeEach(() => {
    cy.visit('/', { log: false })
  })

  it('Initial state is rendered in view', () => {
    mountApp({
      init: { property: 123 },
      view: state => h('div', {}, state.property),
    })

    getAppRoot().should('text', '123')
  })

  it('Initial state function result is rendered', () => {
    mountApp({
      init: () => 123,
      view: state => h('div', {}, state),
    })

    getAppRoot().should('text', '123')
  })
})

// Actions are invoked by event handlers, other actions, subscriptions or effects
// They update the state or return a request for another action or effect
describe('Actions', () => {
  beforeEach(() => {
    cy.visit('/', { log: false })
  })

  // event handlers have a name of the form on<Event>
  it('Events evoke action functions which update State', () => {
    const action = state => state + 2
    const action2 = (state, param) => state + param
    const payloadXform = event => {
      expect(event.type, 'event type').eq('click')
      return 20
    }
    const action3 = () => [action2, 30]

    mountApp({
      init: 0,
      view: state =>
        h('div', {}, [
          state,
          h('button', { onClick: state => state + 1 }, 'inline +1'),
          h('button', { onClick: action }, 'function +2'),
          h('button', { onClick: [action2, 10] }, 'tuple value +10'),
          h('button', { onClick: [action2, payloadXform] }, 'tuple xform +20'),
          h('button', { onClick: action3 }, 'chain +30'),
        ]),
    })

    getAppRoot().should(haveElementText('0'))
    cy.contains('inline +1').click()
    getAppRoot().should(haveElementText('1'))
    cy.contains('function +2').click()
    getAppRoot().should(haveElementText('3'))
    cy.contains('tuple value +10').click()
    getAppRoot().should(haveElementText('13'))
    cy.contains('tuple xform +20').click()
    getAppRoot().should(haveElementText('33'))
    cy.contains('chain +30').click()
    getAppRoot().should(haveElementText('63'))
  })

  // NB actions do NOT mutate the state, they return new state
  // this may reqauire a deep copy.
  it('Action returns new state', () => {
    const action = state => state + 2

    mountApp({
      init: 'state',
      view: state =>
        h('div', {}, [
          state,
          h('button', { onClick: ['new state'] }, 'action'),
        ]),
    })

    getAppRoot().should(haveElementText('state'))
    cy.contains('action').click()
    getAppRoot().should(haveElementText('new state'))
  })

  it('Action returns tuple reference to action which updates State', () => {
    const action = (state, param) => `${state} ${param}`
    const fn = ev => `${ev.type} ret`

    mountApp({
      init: 'state',
      view: state =>
        h('div', {}, [
          state,
          h('button', { onClick: [action, 'arg'] }, 'reducer 1'),
          h('button', { onClick: [action, fn] }, 'reducer 2'),
          h('button', { onClick: 'state' }, 'reset'),
        ]),
    })

    cy.contains('reducer 1').click()
    getAppRoot().should(haveElementText('state arg'))
    cy.contains('reset').click()
    getAppRoot().should(haveElementText('state'))
    cy.contains('reducer 2').click()
    getAppRoot().should(haveElementText('state click ret'))
    cy.contains('reset').click()
  })
})

// Effects are functions that perform side effect and are called from actions.
// Effects are defined by a Tuple returned by an action: [state, [action, arg}]]
// Use Effects so Actions remain pure functions
describe('Effects', () => {
  beforeEach(() => {
    cy.visit('/', { log: false })
  })

  it('Action invokes Effect', () => {
    // simulate a side effect with a variable update
    let sideEffect = ''

    function effect(dispatch, param) {
      sideEffect = param
    }

    mountApp({
      init: 'state',
      view: state =>
        h('div', {}, [
          state,
          h('button', { onClick: ['new state', [effect, 'arg']] }, 'effect 1'),
        ]),
    })

    cy.contains('effect 1').click()
    cy.should(() => expect(sideEffect).eq('arg'))
    getAppRoot().should(haveElementText('new state'))
  })

  // An Action can invoke multiple actions
  it('Action invokes multiple Effects', () => {
    let sideEffect = ''

    const effect1 = (dispatch, param) => {
      sideEffect = `e1 ${param}`
    }

    const effect2 = (dispatch, param) => {
      sideEffect = `${sideEffect} e2 ${param}`
    }

    mountApp({
      init: 'state',
      view: state =>
        h('div', {}, [
          state,
          h(
            'button',
            { onClick: [state, [effect1, 'arg1'], [effect2, 'arg2']] },
            'effect 1'
          ),
        ]),
    })

    cy.contains('effect 1').click()
    cy.should(() => expect(sideEffect).eq('e1 arg1 e2 arg2'))
  })

  // An effect can call any actions passed to it for input to hyperapp
  // The state will be first set to the provided value
  it('Action invokes Effect which invokes another action', () => {
    const action = (state, param) => `action ${state} ${param}`

    const effect = (dispatch, { action, arg }) => {
      dispatch([action, arg]) // could be async
    }

    mountApp({
      init: 'state',
      view: state =>
        h('div', {}, [
          state,
          h(
            'button',
            {
              onClick: ['new-state', [effect, { action, arg: 'arg' }]],
            },
            'effect 1'
          ),
        ]),
    })

    cy.contains('effect 1').click()
    getAppRoot().should(haveElementText('action new-state arg'))
  })
})

// Subscriptions wire up external events (or streams) to Actions
// They are automatically cleaned up when no longer needed
// and are defined by a set of Tuples returned from a function
// that is passed current state whenever it changes
describe('Subscriptions', () => {
  beforeEach(() => {
    cy.visit('/', { log: false })
  })

  it('Subscription invokes action each tick and stops & starts', () => {
    const action = (state, ticks) => ({
      ...state,
      ticks,
    })

    let ticks = 0

    const effect = (dispatch, { action, tick }) => {
      let id = setInterval(function() {
        dispatch(action, ticks++)
      }, tick)
      return () => {
        clearInterval(id)
      }
    }

    mountApp({
      init: { enabled: true, ticks: 0 },
      view: state =>
        h('div', {}, [
          h('p', {}, `enabled: ${state.enabled}`),
          h('p', {}, `ticks: ${state.ticks}`),
          h(
            'button',
            { onClick: state => ({ ...state, enabled: !state.enabled }) },
            'stop/start'
          ),
        ]),
      subscriptions: state => {
        return [state.enabled && [effect, { action, tick: 250 }]]
      },
    })

    cy.contains('ticks').should('have.text', 'ticks: 1')
    cy.contains('ticks').should('have.text', 'ticks: 2')
    cy.contains('stop/start').click()
    cy.contains('enabled').should('have.text', 'enabled: false')
    cy.contains('ticks').should('not.have.text', 'ticks: 3')
    cy.contains('stop/start').click()
    cy.contains('enabled').should('have.text', 'enabled: true')
    cy.contains('ticks').should('have.text', 'ticks: 3')
  })
})

describe('Misc', () => {
  beforeEach(() => {
    cy.visit('/', { log: false })
  })

  it('Two independent apps', () => {
    mountApp(
      {
        init: 0,
        view: state =>
          h('div', {}, [
            state,
            h('button', { onClick: state => state + 1 }, '+'),
          ]),
      },
      'app1'
    )

    mountApp(
      {
        init: 0,
        view: state =>
          h('div', {}, [
            state,
            h('button', { onClick: state => state + 2 }, '+2'),
          ]),
      },
      'app2'
    )

    cy.contains('+').click()
    cy.get('div#app1').should(haveElementText('1'))
    cy.contains('+2').click()
    cy.get('div#app2').should(haveElementText('2'))
    cy.get('div#app1').should(haveElementText('1'))

    unmountApp('app1')
    unmountApp('app2')
  })

  // TODO Lazy
})
