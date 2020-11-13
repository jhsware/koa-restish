import "@babel/polyfill"
import { matchPath } from '../lib/matchPath'
// import Client from 'koa-restish/lib/restish-client'
import { expect } from 'chai'

describe("matchPath", () => {
  it("matches exact", async function () {
    const pathExp = {
      path: '/admin/:type/:id'
    }
    const match = matchPath('/admin/User/5f84669489e28231b5119220', pathExp)
    expect(match).to.not.equal(undefined)
    expect(match.isExact).to.equal(true)
  })

  it("matches partial", async function () {
    const pathExp = {
      path: '/admin/:type',
      exact: false
    }
    const match = matchPath('/admin/User/5f84669489e28231b5119220', pathExp)
    expect(match).to.not.equal(undefined)
    expect(match.isExact).to.equal(false)
  })

  it("no match when missing", async function () {
    const pathExp = {
      path: '/admin/:type/:id',
      exact: false
    }
    const match = matchPath('/admin/User', pathExp)
    expect(match).null
  })
})