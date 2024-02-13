import { matchPath } from './matchPath'
import { RestishServerError, InternalServerError } from './errors'
import type { THandlers } from './types'

const IS_DEVELOPMENT = process.env.NODE_ENV?.toLowerCase() === 'development'

function _genStatusCode (method) {
  switch (method) {
    case 'create':
      return 201
    default:
      return 200
  }
}

function _genResultFromError(e: any) {
  if (e instanceof RestishServerError) {
    return { body: undefined, status:  e.code }
  }
  else {
    console.log(e)
    return { body: undefined, status:  500 }
  }
}

export default class Router {
  _handlers: THandlers;

  constructor () {
    this._handlers = {
      create: [],
      query: [],
      update: [],
      delete: []
    }
  }

  create (pathname, handler) {
    this._handlers.create.push({
      pathname,
      handler
    })
  }

  query (pathname, handler) {
    this._handlers.query.push({
      pathname,
      handler
    })
  }

  update (pathname, handler) {
    this._handlers.update.push({
      pathname,
      handler
    })
  }

  delete (pathname, handler) {
    this._handlers.delete.push({
      pathname,
      handler
    })
  }

  routes () {
    return async (ctx, next) => {
      // console.log('******** YOU GOT ME! *********')
      const outp = {}

      const promises = ctx.request.body.actions.map(({ URI, method, query, shape, data, cacheKey}) => {
        
        const { handler, params } = this._handlers[method].reduce((prev, curr) => {
          if (prev !== undefined) {
            return prev
          }

          const match = matchPath(URI, { path: curr.pathname })

          if (match) {
            match.handler = curr.handler
            return match
          }
        }, undefined)
        
        /*
        let handler
        for (let n = 0; n < this._queryHandlers.length; n++) {
          if (this._queryHandlers[n].pathname === URI) {
            handler = this._queryHandlers[n].handler
            break
          }
        }
        */


        try {
          const result = handler({ URI, query, shape, params, data, ctx })

          if (result && result.then) {
            return result
              .then((res) => {
                outp[cacheKey] = {
                  body: res,
                  status: _genStatusCode(method)
                }
              })
              // Handle errors in async handlers
              .catch((e) => {
                outp[cacheKey] = _genResultFromError(e)
              })
          } else {
            outp[cacheKey] = {
              body: result,
              status: _genStatusCode(method)
            }
            return Promise.resolve()
          }
        }
        catch (e) {
          // Handle errors in sync handlers and general stuff
          outp[cacheKey] = _genResultFromError(e)
          return Promise.resolve()
        }
      })
      
      // In case we have stuff going on downstream...
      await next()
    
      await Promise.all(promises)
      IS_DEVELOPMENT && console.log(`[koa-restish] Actions resolved:`)
      ctx.body = outp
      IS_DEVELOPMENT && console.log(JSON.stringify(outp))
    }
  }
}
