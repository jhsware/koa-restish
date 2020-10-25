require("@babel/polyfill")
const { expect } = require('chai')
const { purgeWithShape } = require('../lib/purgeWithShape')

describe("purge data using shapes", () => {


  describe("return entire object", () => {
    it("Returns all data", async function () {
      const tmp = purgeWithShape(testData, undefined)

      expect(JSON.stringify(tmp)).to.equal(JSON.stringify(testData))
    })

    it("Returns all data", async function () {
      const shape = [
        ['*'],
        ['*.*'],
        ['*.*.*']
      ]
      const tmp = purgeWithShape(testData, shape)

      expect(JSON.stringify(tmp)).to.equal(JSON.stringify(testData))
    })

    it("Only return first level primitive types", async function () {
      const { firstName, lastName } = testData
      const target = { firstName, lastName }

      const shape = [
        ['*']
      ]
      const tmp = purgeWithShape(testData, shape)

      expect(JSON.stringify(tmp)).to.equal(JSON.stringify(target))
    })

    it("Return first level and second level primitive types", async function () {
      const { firstName, lastName, friends } = testData
      const target = {
        firstName,
        lastName,
        metaData: {
          age: testData['metaData']['age']
        },
        friends
      }

      const shape = [
        ['*'],
        ['*.*']
      ]
      const tmp = purgeWithShape(testData, shape)

      expect(JSON.stringify(tmp)).to.equal(JSON.stringify(target))
    })

    it("Return all first level, except metaData, and second level primitive types", async function () {
      const { firstName, lastName, friends } = testData
      const target = {
        firstName,
        lastName,
        friends
      }

      const shape = [
        ['*', "!metaData"],
        ['*.*']
      ]
      const tmp = purgeWithShape(testData, shape)

      expect(JSON.stringify(tmp)).to.equal(JSON.stringify(target))
    })

    it("Return all first to third level except metaData.scores", async function () {
      const { firstName, lastName, friends } = testData
      const target = {
        firstName,
        lastName,
        metaData: {
          age: testData['metaData']['age'],
          size: testData['metaData']['size']
        },
        friends
      }

      const shape = [
        ['*'],
        ['*.*', 'metaData.!scores'],
        ['*.*.*'],
      ]
      const tmp = purgeWithShape(testData, shape)

      expect(JSON.stringify(tmp)).to.equal(JSON.stringify(target))
    })
  })

  
})

var testData = {
  firstName: 'Koa',
  lastName: 'Restish',
  metaData: {
    age: '1',
    scores: [1,2,3],
    size: {
      width: 11,
      height: 22,
      depth: 33
    }
  },
  friends: [
    'component',
    'registry',
    'isomorphic',
    'schema'
  ]
}
