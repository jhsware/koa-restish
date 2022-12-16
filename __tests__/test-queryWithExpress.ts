import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import expressServer from '../__mocks__/serverExpress'
import Client from '../src/restish-client'


const PORT = 3904
const SERVER_ENDPOINT = `http://localhost:${PORT}/restish`

describe("restish-client query (express)", () => {

  let server;

  beforeAll((done) => {
    server = expressServer.listen(PORT, () => {
      console.log('The test server is started at ' + PORT)
      done()
    })
  })

  afterAll(() => {
    server.close()
  })

  describe("queries can be (legacy)", () => {
    it("sent (legacy)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { data } = await backend.query({
        URI: '/content/Post'
      })
      
      expect(Array.isArray(data)).toEqual(true)
      expect(data[0]._type).toEqual('Post')
    })

    it("batched with array (legacy)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { data } = await backend.query([
        { URI: '/content/Post/1' },
        { URI: '/content/Comment/1' },
        { URI: '/content/Photo/1' }
      ])
      expect(data[0]._type).toEqual('Post')
      expect(data[1]._type).toEqual('Comment')
      expect(data[2]._type).toEqual('Photo')
    })

    it("cached (legacy)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const orig = await backend.query({
        URI: '/content/Cached/1'
      })
      const origData = orig.data

      const {data} = await backend.query({
        URI: '/content/Cached/1'
      })
      expect(data._id).toEqual(origData._id)
      expect(data.timestamp).toEqual(origData.timestamp)
    })
  })

  describe("create can be (legacy)", () => {
    it("sent for a single endpoint (legacy)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const data = {
        some: "test"
      }

      const { data: createdData } = await backend.create({
        URI: '/content/Post',
        data
      })

      expect(createdData._type).toEqual('Post')
      expect(createdData._id).not.toEqual(undefined)
      expect(createdData.testString).toEqual('create')
    })

    it("sent for multiple endpoints (legacy)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const data = {
        some: "test"
      }

      const { data: createdData } = await backend.create([
        { URI: '/content/Post', data },
        { URI: '/content/User', data }
      ])
      expect(Array.isArray(createdData)).toEqual(true)
      expect(createdData[0]._type).toEqual('Post')
      expect(createdData[1]._type).toEqual('User')
      expect(createdData[0].testString).toEqual('create')
    })
  })

  describe("the cache can be (legacy)", () => {

    it("invalidated by single endpoint (legacy)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { data: tmpData } = await backend.query({
        URI: '/content/Cached/1'
      })
      const origData = Object.assign({}, tmpData)
      
      await backend.delete({
        URI: '/content/Cached/1',
        invalidate: '/content/Cached'
      })

      const {data} = await backend.query({
        URI: '/content/Cached/1'
      })

      expect(data._id).toEqual(origData._id)
      expect(data.timestamp).not.toEqual(origData.timestamp)
    })

    it("invalidated by multiple endpoints (legacy)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })
      let res

      const { data: origData } = await backend.query([
        { URI: '/content/Post/1' },
        { URI: '/content/User/1' }
      ])

      // Need to copy these so they don't get updated
      // by the object cache
      const origPost = Object.assign({}, origData[0])
      const origUser = Object.assign({}, origData[1])
            
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

      expect(post._id).toEqual(origPost._id)
      expect(user._id).toEqual(origUser._id)
      expect(post.timestamp).not.toEqual(origPost.timestamp)
      expect(user.timestamp).not.toEqual(origUser.timestamp)
    })
  })

  describe("queries can be", () => {
    it("sent", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const res = await backend.query({
        URI: '/content/Post'
      })

      const { result } = res
      expect(Array.isArray(result.body)).toEqual(true)
      expect(result.body[0]._type).toEqual('Post')
      expect(result.status).toEqual(200)
    })

    it("batched with array", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { result } = await backend.query([
        { URI: '/content/Post/1' },
        { URI: '/content/Comment/1' },
        { URI: '/content/Photo/1' }
      ])
      expect(Array.isArray(result)).toEqual(true)
      expect(result[0].status).toEqual(200)
      expect(result[1].status).toEqual(200)
      expect(result[2].status).toEqual(200)
      expect(result[0].body._type).toEqual('Post')
      expect(result[1].body._type).toEqual('Comment')
      expect(result[2].body._type).toEqual('Photo')
    })

    it("cached", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const orig = await backend.query({
        URI: '/content/Cached/1'
      })
      const origData = orig.data

      const {result} = await backend.query({
        URI: '/content/Cached/1'
      })
      expect(result.status).toEqual(200)
      expect(result.body._id).toEqual(origData._id)
      expect(result.body.timestamp).toEqual(origData.timestamp)
    })
  })

  describe("create can be", () => {
    it("sent for a single endpoint", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const data = {
        some: "test"
      }

      const { result } = await backend.create({
        URI: '/content/Post',
        data
      })

      const { body, status } = result

      expect(body._type).toEqual('Post')
      expect(body._id).not.toEqual(undefined)
      expect(body.testString).toEqual('create')
      expect(status).toEqual(201)
    })

    it("sent for multiple endpoints", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const data = {
        some: "test"
      }

      const { result } = await backend.create([
        { URI: '/content/Post', data },
        { URI: '/content/User', data }
      ])
      expect(Array.isArray(result)).toEqual(true)
      expect(result[0].body._type).toEqual('Post')
      expect(result[0].status).toEqual(201)
      expect(result[1].body._type).toEqual('User')
      expect(result[1].status).toEqual(201)
      expect(result[0].body.testString).toEqual('create')
    })
  })

  describe("the cache can be", () => {

    it("invalidated by single endpoint", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { result: tmpResult } = await backend.query({
        URI: '/content/Cached/1'
      })
      const origData = Object.assign({}, tmpResult.body)
      
      await backend.delete({
        URI: '/content/Cached/1',
        invalidate: '/content/Cached'
      })

      const {result} = await backend.query({
        URI: '/content/Cached/1'
      })

      expect(result.body._id).toEqual(origData._id)
      expect(result.body.timestamp).not.toEqual(origData.timestamp)
    })

    it("invalidated by multiple endpoints", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })
      let res

      const { result: tmpResult } = await backend.query([
        { URI: '/content/Post/1' },
        { URI: '/content/User/1' }
      ])

      // Need to copy these so they don't get updated
      // by the object cache
      const origPost = Object.assign({}, tmpResult[0].body)
      const origUser = Object.assign({}, tmpResult[1].body)
            
      await backend.delete({
        URI: '/content/SomeOne/1',
        invalidate: [
          '/content/Post',
          '/users/User'
        ]
      })

      const { result } = await backend.query([
        { URI: '/content/Post/1' },
        { URI: '/content/User/1' }
      ])

      const post = result[0].body
      const user = result[1].body

      expect(post._id).toEqual(origPost._id)
      expect(user._id).toEqual(origUser._id)
      expect(post.timestamp).not.toEqual(origPost.timestamp)
      expect(user.timestamp).not.toEqual(origUser.timestamp)
    })
  })

  describe("status object is returned", function () {
    it("by single query (OK)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { result } = await backend.query({
        URI: '/content/Post'
      })
      expect(Array.isArray(result.body)).toEqual(true)
      expect(result.status).toEqual(200)
    })

    it("by single query (Not Found)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { result } = await backend.query({
        URI: '/content/NoneExisting'
      })
      expect(result.body).toEqual(undefined)
      expect(result.status).toEqual(404)
    })
    
    it("by single query (Internal Server Error)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { result } = await backend.query({
        URI: '/content/ServerError'
      })
      expect(result.body).toEqual(undefined)
      expect(result.status).toEqual(500)
    })

    it("by batched query (Not Found)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { result } = await backend.query([
        { URI: '/content/NoneExisting' },
        { URI: '/content/AnotherNoneExisting' },
      ])
      expect(Array.isArray(result)).toEqual(true)
      expect(result[0].status).toEqual(404)
      expect(result[0].body).toEqual(undefined)
      expect(result[1].status).toEqual(404)
      expect(result[1].body).toEqual(undefined)
    })
    it("by batched query (OK / Not Found)", async function () {
      const backend = new Client({ API_URI: SERVER_ENDPOINT })

      const { result } = await backend.query([
        { URI: '/content/Post' },
        { URI: '/content/NoneExisting' },
      ])
      expect(Array.isArray(result)).toEqual(true)
      expect(result[0].status).toEqual(200)
      expect(Array.isArray(result[0].body)).toEqual(true)
      expect(result[1].status).toEqual(404)
      expect(result[1].body).toEqual(undefined)
    })
  })
})