import koa from 'koa'
import logger from 'koa-logger'
import session from 'koa-session'
import koaRouter from 'koa-router'
import RestishRouter from '../lib/koa-restish'
import koaJSONBody from 'koa-json-body'

const app = new koa();
const router = new koaRouter();

const SESSION_CONFIG = {
  httpOnly: true,
  maxAge: 86400000,
  signed: false
}

app.use(logger((str, args) => {
  // console.log(str)
}))

app.use(session(SESSION_CONFIG, app))

const restish = new RestishRouter()

restish.create('/content/:type', async ({ URI, query, shape, params, data }) => {
  return {
    _type: params.type,
    _id: Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    testString: "create"
  }
})

restish.query('/content/:type/:id?', async ({ URI, query, shape, params }) => {
  if (params.id) {
    return Promise.resolve({
      _type: params.type,
      _id: params.id,
      timestamp: new Date().toISOString(),
      testString: "query"
    })
  }
  else {
    const timestamp = new Date().toISOString()
    const outp = []
    for (let i = 0; i++ < 10;) {
      outp.push({
        _type: params.type,
        _id: Math.floor(Math.random() * 1000),
        timestamp,
        testString: "query"
      })
    }
    return outp
  }
})

restish.update('/content/:type/:id', async ({ URI, query, shape, params }) => {
  return {
    _type: params.type,
    _id: params.id,
    timestamp: new Date().toISOString(),
    testString: "update" 
  }
})

restish.delete('/content/:type/:id', async ({ URI, query, shape, params }) => {
  return
})

router.post('/restish', koaJSONBody(), restish.routes());
router.get('/restish', (ctx) => ctx.body = 'ok');

app.use(router.routes());
app.use(router.allowedMethods());

export default app
/*
app.listen(PORT, () => {
  console.log('Server listening on: ' + PORT)
})
*/