import "@babel/polyfill"
import expressServer from './serverExpress'
import axios from 'axios'
import { expect } from 'chai'

const PORT = 3901
const SERVER_ENDPOINT = `http://localhost:${PORT}/restish`

describe("express-restish server middleware", () => {

  let server;

  before((done) => {
    server = expressServer.listen(PORT, () => {
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