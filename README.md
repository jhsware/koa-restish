# koa-restish

RESTish is the natural evolution of REST APIs, with the addition of batch calls and client-side endpoint level caching. This bridges some of the gap between GraphQL and REST but at 1/10th of the size.

The library consists of a server-side and a client-side part. The client-side code is isomorphic, so it runs both in a browser and on Node.js.

One of the greatest points of confusion with REST was how to use the verbs GET, PUT, POST and DELETE (okay, the last one is probably the least ambiguous). In RESTish they are simply called create, query, update and delete.

The server-side library defines your endpoints. The syntax is very similar to ordinary express or koa routes. If you have exprience of REST you will feel right at home. This is where you integrate your API:s and data sources. You also implement your session handling at this level allowing your frontend application to access the RESTish API directly from the browser. Note: if you do server-side rendering, you need to pass you cookies to the RESTish API, see example.

The client-side library abstracts data fetching and handles endpoint caching. This allows the library to transparently share API-state across multiple components in a single page application. By sharing state through caching you don't have to worry about the performance penalty of repeating calls to the API. Once an endpoint has been cached the results will be returned immediately through a `Promise.resolve()`. This makes the code more readable with less dependency between components.

Because RESTish uses the mental model of a REST API, it is easy to learn and lowers the cost of migration by several orders of magnitude. This lightweight approach is a perfect candidate to run on a serverless platform, integrating your micro-services.

## Changelog
v0.4 deprecates properties `data` and `status` returned in the client response object  (will be removed in 1.0 release).
Use `result` instead, it includes both body and status for each action. To set status codes, throw the custom errors available in `koa-restish/lib/errors`. See ___test___/server.js and ___test___/serverExpress.js for examples.

NOTE: Version 0.3 client is incompatible with 0.4 server code and vice versa. Make sure you use the same version on both client and server. After 1.0 release, we will maintain backward compatibility.

## A RESTish endpoint handler
The RESTish endpoint handler is passed six named parameters. It is up to the developer to implement all the code in these handlers. This gives maximum flexibility.

- **URI** {string} - the RESTish URI used to access the endpoint (as passed from the client)
- **query** {object} - query params passed from the client (unedifined in most cases not involving queries)
- **sortBy** {object} - select sort order
- **shape** {object} - a flat shape object consisting of a list of expressions defining what output data we want (note, it is up to the developer to implement this, there are helper methods in `purgeWithShape.js` to help you but they are currently experimental, check the tests and docs at the end of this README)
- **params** {object} - params of the URIas defined in the RESTish endpoint paths `/content/:type` provides the type param
- **ctx** {object} - contains the `request` and `response` object, also the `session` object if available.

Note that both koa-restish and express-restish handles sending your data to the client. All you need to do is return your result.

```js
const createHandler = async ({ URI, query, shape, params, data, ctx }) => {
  // Your code here that returns data in some shape or form:
  return {
    type: params.type
  }
})

restish.create('/content/:type', createHandler)
```

## express-restish
If you use Express.js there is a RESTish router available in `express-restish.js`. The endpoint handlers look identical to that of KoaJS below but th code to hookup the RESTish router. You can look at the tests in `__test__/serverExpress.js`.

```js
import RestishRouter from 'koa-restish/lib/express-restish'
const restish = new RestishRouter()

router.post('/restish', express.json(), restish.routes());
router.get('/restish', (req, res, next) => res.send('ok'));
```

The express-restish endpoint handlers are passed the `request`, `response` and `session` (if available) objects in the `ctx` param to keep consistency with koa-restish.

## Server-side code example using KoaJS

index.mjs
```js
import koa from 'koa'
import logger from 'koa-logger'
import session from 'koa-session'
import koaRouter from 'koa-router'
import RestishRouter from 'koa-restish/lib/koa-restish'
import koaJSONBody from 'koa-json-body'
import { createSession, querySession, endSession, initUsers } from './types/session'
import { createContent, queryContent, updateContent, deleteContent } from './types/content'

const app = new koa();
const router = new koaRouter();

const SESSION_CONFIG = {
  httpOnly: true,
  maxAge: 86400000,
  signed: false
}

app.use(logger((str, args) => {
  console.log(str)
}))

app.use(session(SESSION_CONFIG, app))

const restish = new RestishRouter()

// Endpoints to login, logout and fetch current user
restish.create('/session', createSession)
restish.query('/session', querySession)
restish.delete('/session', endSession)

// Endpoints to CRUD content
restish.create('/:type', createContent)
restish.query('/:type/:id?', queryContent)
restish.update('/:type/:id', updateContent)
restish.delete('/:type/:id', deleteContent)

router.post('/restish', koaJSONBody(), restish.routes());
router.get('/restish', (ctx) => ctx.body = 'ok');

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
  console.log('Server listening on: ' + PORT)
})
```

types/session.mjs
```js
const querySession = async ({ URI, query, shape, params, ctx }) => {
  return ctx.session.currentUser
})

async function createSession ({ URI, query, shape, params, data, ctx }) {
  /* Your code here to validate and fetch user */
  ctx.session.currentUser = { ... }
  return ctx.session.currentUser
})

const endSession = ({ URI, query, shape, params, ctx }) => {
  delete ctx.session.currentUser
}

export {
  createSession,
  querySession,
  endSession
}
```

types/content.mjs
```js
async function queryContent ({ URI, query, shape, params, ctx }) {
  if (params.id) { // Fetch object by ID
    /* Your code here */
    return obj
  }
  else { // Find objects by query
    /* Your code here */
    return resArray
  }
})

async function createContent ({ URI, data, shape, params, ctx }) {
  /* Your code here */
  return newObj
})

async function updateContent ({ URI, data, shape, params, ctx }) {
  /* Your code here */
  return updatedObj
})

async function deleteContent ({ URI, query, shape, params, ctx }) {
  /* Your code here */
})

export {
  createContent,
  queryContent,
  updateContent,
  deleteContent
}
```

## Client-side code examples

```js
import { ApiClient } from 'koa-restish'

const API_URI = 'http://localhost:3000/restish'
const apiClient = new ApiClient({ API_URI })

// Fetch current user
const { result } = await apiClient.query({
  URI: '/session'
})
const { body, status } = result
// status is the equivalent of HTTP status codes
// 200 - OK

// Fetch data from multiple endpoints in a single call
const query = {
  query: {
    section: 'investor'
  }
}
const { result } = await apiClient.query([
  { URI: `/content/app/${appId}` }
  { URI: '/content/page', query }
])
const { body: app, status: statusApp } = result[0]
const { body: pages, status: statusPages = result[1]

// Create an object
const { result } = await apiClient.create({
  URI: '/content/page',
  data: { ... },
  // Invalidates all cached endpoints that start with /content/page
  invalidate: ['/content/page']
})
const { body, status } = result
// status is the equivalent of HTTP status codes
// 201 - Created
```

## Server-side rendering

Passing cookies to RESTish API in Koajs.

```js
import axios from 'axios'
import { ApiClient } from 'koa-restish'

const API_URI = process.env.API_URI || 'http://127.0.0.1:3000/restish'

app.use(async (ctx) => {
  const headers = {}
  if (ctx.headers['cookie']) {
    headers['Cookie'] = ctx.headers['cookie']
  }

  // A new axios instance needs to be instantiated for every call so
  // we don't leak the cookie secret.
  const axiosInstance = axios.create({
    headers
  });

  const apiClient = new ApiClient({
    API_URI,
    // Passing an axios instance with the cookie set to get client session
    axios: axiosInstance
  })

  /**
   * Your server-side rendering code goes here...
   * 
   * const res = await apiClient.query(...)
   * */
})
```

## Recommended folder structure

```js
index.js      // reads .env file and calls app.listen
server.js     // configure your routes, CORS, session handling
endpoints/    // callbacks for OAuth2 etc.
apis/         // contains all your RESTish integrations with external APIs
  serviceX.js // probaly mounted as '/api/serviceX'
  serviceY.js // probaly mounted as '/api/serviceY'
types/        // contains all your RESTish data manipulation endpoints organised by path
  content.js  // content object CRUD  '/content/:type/...'
  user.js     // user CRUD '/user/...'
  session.js  // CRUD for session handling '/session/...'
__tests__/    // tests for RESTish handlers etc.
```

## Writing tests
To call a RESTish handler in your tests you use the following signature:
```js
const URI = '/path/to/endpoint'
const query = {} // Normally passed by client (optional)
const params = {} // Normally determined by RESTish router (optional)
const data = {} // only for write operations (optional)
const ctx = { request, response, session } // Only needed if you access them
handler({ URI, query, shape, params, data, ctx })
```

## Developer notes:

DONE: Implement shape (experimental)

In order to use shape objects you need to call ```purgeWithShape(data, shape)``` from your server-side
code when returning data to client. If the function gets an undefined shape object it will return
the passed data AS IS. Note that the shape object passed here is a nested shape object.

To provide a more developer friendly syntax for shape objects you call ```createNestedShape(flatShape)``` which
will convert a flat list of expressions to a nested shape object you can pass to ```purgeWithShape()```.

You should always use the flat shape object syntax in clients for readability. Examples of the developer friendly flat shape object syntax can be seen here:

```js
shape = [
  "discountCode",
  "firstRow",
  "order",
  "order.orderDate",
  "order.orderCurrency",
  "order.orderRows",
  "order.orderRows.itemDescription",
  "order.orderRows.sku",
  "order.orderRows.qty",
]

// All primitive props on first lever except email (skipping objects and arrays)
shape = [
  "*",
  "!email",
]

// All props at first and all primitive types on second level
shape = [
  "*.*",
]

// All props on first two levels and primitive types on third level
shape = [
  "*.*.*",
]

// All primitive props at first level and all primitive types under order
shape = [
  "*",
  "order.*",
]

// All primitive props at first level and all props for order, excluding the array orderRows
shape = [
  "*",
  "order.*.*",
  "order.!orderRows",
]

// All primitive props at first level and all props for order, limiting results in array orderRows
// TODO: Implement limiting for arrays
shape = [
  "*",
  "order.*.*",
  "order.orderRows[0-9]",
]
```

TODO: Create flat shape objects from an isomorphic-schema.

```js
// Create shape from provided schema (useful when getting data for forms etc.)
createShapeFromSchema(schema)
```

Examples of nested shape objects:

```js
// Server-side filter of output is performed by Restish
// Objects do a lookahead to next level to see if they should be included at all
purgeWithShape(data, shape)
[
  ["*", "!email"],
]
[
  ["*"],
  ["*.*"],
]
[
  ["*"],
  ["*.*"],
  ["*.*.*"],
]
[
  ["*"],
  ["order.*"],
]
[
  ["*"],
  ["order.*"],
]
[
  ["*"],
  ["order.*", "order.!orderRows"],
  ["order.*.*"],
]
// Array options hasn't been implemented yest
[
  ["*"],
  ["order.*", "order.orderRows[0-9]"],
  ["order.*.*"],
]
```

## VS Code

This is a launch.json snippet to run tests for debugging. Note setting the env var (see babel.config.js):

```json
    {
      "env": {
        "TARGET": "server"
      },
      "args": [
        "--require",
        "@babel/register",
        "-u",
        "tdd",
        "--timeout",
        "999999",
        "--colors",
        "${file}"
      ],
      "internalConsoleOptions": "openOnSessionStart",
      "name": "Run Mocha Test File",
      "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
      "request": "launch",
      "skipFiles": [
        "<node_internals>/**"
      ],
      "sourceMaps": true,
      "type": "pwa-node"
    },
```

TODO: Did this break matching of routes when layered?
  "Removed unused options in matchPath, and specifying strict using exact	2e8c9bc	jhsware"
  "/admin/:type" without "exact" prop should match "/admin/User/5f84669489e28231b5119220"
