// import { safeGet } from 'safe-utils'
import { matchPath } from './matchPath'

const IS_DEVELOPMENT = (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()) === 'development'

class Router {

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

        const result = handler({ URI, query, shape, params, data, ctx })
        if (result && result.then) {
          return result.then((res) => {
            outp[cacheKey] = res
            return res
          }).catch((e) => {
            // TODO: We should pass errors to error object, this is a quickfix so we get results
            return undefined
          })
        } else {
          outp[cacheKey] = result
          return Promise.resolve(result)
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

export default Router