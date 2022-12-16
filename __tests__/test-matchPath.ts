import { describe, expect, it } from "@jest/globals";
import { matchPath } from '../src/matchPath'

describe("matchPath", () => {
  it("matches exact", async function () {
    const pathExp = {
      path: '/admin/:type/:id'
    }
    const match = matchPath('/admin/User/5f84669489e28231b5119220', pathExp)
    expect(match).not.toEqual(undefined)
    expect(match.isExact).toEqual(true)
  })

  it("matches partial", async function () {
    const pathExp = {
      path: '/admin/:type',
      exact: false
    }
    const match = matchPath('/admin/User/5f84669489e28231b5119220', pathExp)
    expect(match).not.toEqual(undefined)
    expect(match.isExact).toEqual(false)
  })

  it("no match when missing", async function () {
    const pathExp = {
      path: '/admin/:type/:id',
      exact: false
    }
    const match = matchPath('/admin/User', pathExp)
    expect(match).toEqual(null);
  })
})