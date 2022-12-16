import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import expressServer from '../__mocks__/serverExpress'
import axios from 'axios'

const PORT = 3901
const SERVER_ENDPOINT = `http://localhost:${PORT}/restish`

describe("express-restish server middleware", () => {

  let server;

  beforeAll((done) => {
    server = expressServer.listen(PORT, () => {
      console.log('Test server started at ' + PORT)
      done()
    })
  })

  afterAll(() => {
    server.close()
  })

  describe("Test server", () => {
    it("Is running", async function () {
      const {data, status} = await axios.get(SERVER_ENDPOINT)
      expect(status).toEqual(200)
    })
  })
})