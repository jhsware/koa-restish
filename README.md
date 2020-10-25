# koa-restish

RESTish is the natural evolution of REST APIs, with the addition of batch calls and client-side endpoint level caching. This bridges some of the gap between GraphQL and REST but at 1/10th of the size.

The library consists of a server-side and a client-side part. The client-side code is isomorphic, so it runs both in a browser and on Node.js.

One of the greatest points of confusion with REST was how to use the verbs GET, PUT, POST and DELETE (okay, the last one is probably the least ambiguous). In RESTish they are simply called create, query, update and delete.

The server-side library defines your endpoints. The syntax is very similar to ordinary express or koa routes. If you have exprience of REST you will feel right at home. This is where you integrate your API:s and data sources. You also implement your session handling at this level allowing your frontend application to access the RESTish API directly from the browser. Note: if you do server-side rendering, you need to pass you cookies to the RESTish API, see example.

The client-side library abstracts data fetching and handles endpoint caching. This allows the library to transparently share API-state across multiple components in a single page application. By sharing state through caching you don't have to worry about the performance penalty of repeating calls to the API. Once an endpoint has been cached the results will be returned immediately through a `Promise.resolve()`. This makes the code more readable with less dependency between components.

Because RESTish uses the mental model of a REST API, it is easy to learn and lowers the cost of migration by several orders of magnitude. This lightweight approach is a perfect candidate to run on a serverless platform, integrating your micro-services.

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
const { data } = await apiClient.query({
  URI: '/session'
})

// Fetch data from multiple endpoints in a single call
const query = {
  query: {
    section: 'investor'
  }
}
const { data } = await apiClient.query([
  { URI: `/content/app/${appId}` }
  { URI: '/content/page', query }
])
const app = data[0]
const pages = data[1]

// Create an object
const { data } = await apiClient.create({
  URI: '/content/page',
  data: { ... },
  // Invalidates all cached endpoints that start with /content/page
  invalidate: ['/content/page']
})
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

Developer notes:

TODO: Implement shape
```js
shape = [
  "discountCode",
  "firstRow",
  "order",
  "order.orderDate",
  "order.orderCurrency",
  "order.orderRows[]",
  "order.orderRows[].itemDescription",
  "order.orderRows[].sku",
  "order.orderRows[].qty",
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
  "order.!orderRows[]",
]

// All primitive props at first level and all props for order, limiting results in array orderRows
shape = [
  "*",
  "order.*.*",
  "order.orderRows[0-9]",
]

// Create shape from provided schema (useful when getting data for forms etc.)
createShapeFromSchema(schema)

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
  ["order.*", "order.!orderRows[]"],
  ["order.*.*"],
]
[
  ["*"],
  ["order.*", "order.orderRows[0-9]"],
  ["order.*.*"],
]

```