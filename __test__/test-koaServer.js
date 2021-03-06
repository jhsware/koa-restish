import "@babel/polyfill"
import koaServer from './server'
import axios from 'axios'
import { expect } from 'chai'

const PORT = 3901
const SERVER_ENDPOINT = `http://localhost:${PORT}/restish`

describe("koa-restish server middleware", () => {

  let server;

  before((done) => {
    server = koaServer.listen(PORT, () => {
      console.log('Test server started at ' + PORT)
      done()
    })
  })

  after(() => {
    server.close()
  })

  describe("Test server", () => {
    it("Is running", async function () {      
      const {data, status} = await axios.get(SERVER_ENDPOINT)
      expect(status).to.equal(200)
    })
  })
})