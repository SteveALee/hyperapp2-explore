# Interactive docs for Hyperapp 2.0 using Cypress

## A Cypress spec file that exercises and explains the hyperscript 2.0 API

The usual way to learn a new API is read the docs including a scan of the reference in order to get to grip with the key concepts. Tutorial articles or videos are often useful for the details but sometimes the 'signal to noise ratio' is not ideal for personal preferences. Finally playing with examples in local or online coding tools or REPLs helps exploring specific requirements.

I thought using tests could help explain the API in a way that is concise code and more reproducable than adhoc coding with manual or interactive experiments. BDD style tests are particularlyh helpful in explaining how an API behavies without white box knowledge.

Cypress in particular has several great features that should make this work well for learning:

- Runs in-process in the browser so is fast and reliable. Plus full access to all code.
- Can click on any result in the runner to jump to it in UI and browser state
- Use browser F12 tools to further explore the code
- Easy to use commands build on Mocha & Chai assertions and retry automatically

We suggest:

- Run the tests `npm test` and look at the runner output
- Click on any of the runner test lines to expand it and set the browser state
- Read the [spec file code](cypress/integration/hyperapp2-api.spec.js))
- Open the F12 browser dev tools
- Click on an assert to see detailed ouput in the F12 console
- Edit the spec file adding `.only` to `describe` or `it` statements (eg `its.only(`) to limit the tests
- Add the `.debug` Cypress command to break into F12 debugger at interesting points
- Hack the view and test code to explore the API.
- Read the [hyperapp source](hyperapp.js) - it's small
