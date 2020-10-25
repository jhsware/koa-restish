import express, { response } from 'express'
import RestishRouter from '../lib/express-restish'

const app = express();
const router = express.Router();

app.use(function (req, res, next) {
  // console.log('%s %s %s', req.method, req.url, req.path)
  next()
})

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

router.post('/restish', express.json(), restish.routes());
router.get('/restish', (req, res, next) => res.send('ok'));

app.use(router)

export default app
/*
app.listen(PORT, () => {
  console.log('Server listening on: ' + PORT)
})
*/