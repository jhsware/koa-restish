import "@babel/polyfill"
import koaServer from './server'
import Client from '../lib/restish-client'
// import Client from 'koa-restish/lib/restish-client'
import { expect } from 'chai'

const PORT = 3901
const SERVER_ENDPOINT = `http://localhost:${PORT}/restish`

describe("restish-client query", () => {

  let server;

  before((done) => {
    server = koaServer.listen(PORT, () => {
      console.log('The test server is started at ' + PORT)
      done()
    })
  })

  after(() => {
    server.close()
  })

  describe("queries can be", () => {
    it("sent", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { data } = await backend.query({
        URI: '/content/Post'
      })
      expect(Array.isArray(data)).to.equal(true)
      expect(data[0]._type).to.equal('Post')
    })

    it("batched with array", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { data } = await backend.query([
        { URI: '/content/Post/1' },
        { URI: '/content/Comment/1' },
        { URI: '/content/Photo/1' }
      ])
      expect(data[0]._type).to.equal('Post')
      expect(data[1]._type).to.equal('Comment')
      expect(data[2]._type).to.equal('Photo')
    })

    it("cached", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const orig = await backend.query({
        URI: '/content/Cached/1'
      })
      const origData = orig.data

      const {data, status} = await backend.query({
        URI: '/content/Cached/1'
      })
      expect(data._id).to.equal(origData._id)
      expect(data.timestamp).to.equal(origData.timestamp)
    })
  })

  describe("create can be", () => {
    it("sent for a single endpoint", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const data = {
        some: "test"
      }

      const { data: createdData } = await backend.create({
        URI: '/content/Post',
        data
      })
      expect(createdData._type).to.equal('Post')
      expect(createdData._id).not.to.equal(undefined)
      expect(createdData.testString).to.equal('create')
    })

    it("sent for multiple endpoints", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const data = {
        some: "test"
      }

      const { data: createdData } = await backend.create([
        { URI: '/content/Post', data },
        { URI: '/content/User', data }
      ])
      expect(Array.isArray(createdData)).to.equal(true)
      expect(createdData[0]._type).to.equal('Post')
      expect(createdData[1]._type).to.equal('User')
      expect(createdData[0].testString).to.equal('create')
    })

    it("batched with array", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const {data, status} = await backend.query([
        { URI: '/content/Post/1' },
        { URI: '/content/Comment/1' },
        { URI: '/content/Photo/1' }
      ])
      expect(data[0]._type).to.equal('Post')
      expect(data[1]._type).to.equal('Comment')
      expect(data[2]._type).to.equal('Photo')
    })

    it("cached", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const orig = await backend.query({
        URI: '/content/Cached/1'
      })
      const origData = orig.data

      const {data, status} = await backend.query({
        URI: '/content/Cached/1'
      })
      expect(data._id).to.equal(origData._id)
      expect(data.timestamp).to.equal(origData.timestamp)
    })
  })

  describe("the cache can be", () => {

    it("invalidated by single endpoint", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { data: origData } = await backend.query({
        URI: '/content/Cached/1'
      })
      
      await backend.delete({
        URI: '/content/Cached/1',
        invalidate: '/content/Cached'
      })

      const {data, status} = await backend.query({
        URI: '/content/Cached/1'
      })

      expect(data._id).to.equal(origData._id)
      expect(data.timestamp).not.to.equal(origData.timestamp)
    })

    it("invalidated by multiple endpoints", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })
      let res

      const { data: origData } = await backend.query([
        { URI: '/content/Post/1' },
        { URI: '/content/User/1' }
      ])

      const origPost = origData[0]
      const origUser = origData[1]
            
      await backend.delete({
        URI: '/content/SomeOne/1',
        invalidate: [
          '/content/Post',
          '/users/User'
        ]
      })

      const { data } = await backend.query([
        { URI: '/content/Post/1' },
        { URI: '/content/User/1' }
      ])

      const post = data[0]
      const user = data[1]

      expect(post._id).to.equal(origPost._id)
      expect(user._id).to.equal(origUser._id)
      expect(post.timestamp).not.to.equal(origPost.timestamp)
      expect(user.timestamp).not.to.equal(origUser.timestamp)
    })
  })
})