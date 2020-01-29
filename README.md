# restish

Think of `restish` as the natural evolution of REST APIs, with batch calls and endpoint level caching. This bridges some of the gap between GraphQL and REST but at 1/10th of the size.

The library consists of a server-side library and an isomorphic client-side library.

The server-side library defines your endpoints, using syntax that is very similar to ordinary express or koa routes.

The client-side library abstracts data fetching and handles endpoint caching. This allows the library to share API-state across multiple components in a single page application.

Because `restish` uses the mental model of a REST API, it is easy to learn and lowers the cost of migration by several orders of magnitude.

## Server-side code example using KoaJS

index.mjs
```js
import koa from 'koa'
import logger from 'koa-logger'
import session from 'koa-session'
import koaRouter from 'koa-router'
import RestishRouter from '../lib/koa-restish'
import koaJSONBody from 'koa-json-body'
import { createSession, querySession, endSession, initUsers } from './types/session'
const { createContent, queryContent, updateContent, deleteContent } = require('./types/content')

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