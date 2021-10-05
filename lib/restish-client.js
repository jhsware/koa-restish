import axios from 'axios'
import { matchPath } from './matchPath'

function assert  (assertion, msg) {
  if (!assertion) {
    throw new Error(msg);
  }
}

class Client {
  constructor(props) {
    this.API_URI = props.API_URI
    this.axios = props.axios || axios
  
    this.queryCache = {}
    this.objectCache = {}
  }

  _checkCookie (res) {
    if (typeof window !== 'undefined') return

    if (Array.isArray(res.headers['set-cookie'])) {
      this.setCookie = res.headers['set-cookie'][0]
    }
  }

  _findObjects (inp) {
    let outp = []
    if (Array.isArray(inp)) {
      inp.filter((key) => typeof inp[key] === 'object')
        .forEach((obj) => outp = outp.concat(this._findObjects(obj)))
    } else if (typeof inp === 'object' && inp !== null) {
      if (inp._type && inp._id) {
        outp.push(inp)
  
      }
      Object.keys(inp).filter((key) => typeof inp[key] === 'object')
        .forEach((obj) => outp = outp.concat(this._findObjects(obj)))
    }
    return outp
  }
  
  _invalidateInQueryCache (cacheKeyExpr) {

  }
  
  _storeInCache (cacheKey, data) {
    // Store entity objects in objectCache
    if (cacheKey) {
      this.queryCache[cacheKey] = data
    }
  
    this._findObjects(data).forEach((obj) => {
      if (this.objectCache[`${obj._type}.${obj._id}`]) {
        const cacheObj = this.objectCache[`${obj._type}.${obj._id}`]
        Object.keys(obj).forEach((key) => cacheObj[key] = obj[key])
      } else {
        this.objectCache[`${obj._type}.${obj._id}`] = obj
      }
    })
  }
  
  _fetchFromCache (cacheKey) {
    // TODO: Fetch entity objects from objectCache
    // TODO: Should I use shared pointer to keep them
    // updated or should I create new objects and
    // make sure network calls are performed first?
    return this.queryCache[cacheKey]
  }
  
  
  _toCacheKey(inp) {
    if (Array.isArray(inp)) {
      const tmp = []
      for (var i = 0; i < inp.length; i++) {
        let val = this._toCacheKey(inp[i])
        tmp.push(val)
      }
      return `[${tmp.join(',')}]`
    }
    else if (typeof inp === 'object') {
      const tmp = []
      const keys = Object.keys(inp).sort()
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i]
        let val = this._toCacheKey(inp[key])
        tmp.push(`${key}=${val}`)
      }
      return tmp.join('&')
    }
    else {
      return inp
    }
  }

  hydrate () {
    return this.queryCache
  }
  
  rehydrate (state) {
    if (state) {
      Object.keys(state).forEach(key => this._storeInCache(key, state[key]))
    }
  }

  invalidateCache (pathExp) {
    if (pathExp === '*') {
      // Clear all data (used for logins)
      this.queryCache = {}
      this.objectCache = {}
      return 
    }

    let cacheKeyExpr = (Array.isArray(pathExp) ? pathExp : [pathExp])
  
    const tmpClearKeys = Object.keys(this.queryCache).filter((key) => {
      // Loop through all invalidation expressions to see if we get a match
      return cacheKeyExpr.reduce(
        (prev, curr) => {
          return prev || matchPath(curr, {
            path: key,
            exact: true
          }, undefined)
        }
      )
    })
  
    tmpClearKeys.forEach((key) => {
      delete this.queryCache[key]
    })
  }

  query (opts) {
    let inp, wasArray
    if (Array.isArray(opts)) {
      inp = opts
      wasArray = true
    } else {
      inp = [opts]
    }

    const outp = inp.map(({ URI, query, sortBy, shape, cache = true}) => {
      let queryCacheKey
      if (query) {
        assert(typeof query === 'object')
        queryCacheKey = this._toCacheKey({ query, sortBy, shape })
      }
      
      const cacheKey = URI + (queryCacheKey ? `?${queryCacheKey}` : '')
      if (cache) {
        if (this.queryCache.hasOwnProperty(cacheKey)) {
          // console.log('From CACHE....')
  
          // Check that all objects still exist and return result as resolved promise
          const result = this._fetchFromCache(cacheKey)
          return {URI, method: 'query', query, sortBy, shape, result}
        }
      }

      return {URI, method: 'query', query, sortBy, shape, cacheKey}
    })

    const actions = outp.filter((item) => item.cacheKey)

    // If everything is cached we can return it immediately
    if (actions.length === 0) {
      const result = outp.map((item) => item.result)

      return {
        result: wasArray ? result : result[0],
        data:  wasArray ? result.map((item) => item.body) : result[0].body // for compat
      }
    }

    // Otherwise, call backend and return results when
    // all the queries have been resolved
    return this.axios({
      method: 'post',
      withCredentials: true,
      url: this.API_URI,
      data: {
        actions
      }
    }).then((res) => {
      this._checkCookie(res)
      // console.log('Request....')

      outp.forEach((item) => {
        if (item.cacheKey) {
          item.result = res.data[item.cacheKey]
          this._storeInCache(item.cacheKey, item.result)
          delete item.cacheKey
        }
      })

      const result = outp.map((item) => item.result)

      return {
        result: wasArray ? result : result[0],
        data:  wasArray ? result.map((item) => item.body) : result[0].body // for compat
      }
      // Note: I passed a status prop before but it was pretty useless som removed it
    })
  }

  _mutation (method, opts) {
    let inp, wasArray
    if (Array.isArray(opts)) {
      inp = opts
      wasArray = true
    } else {
      inp = [opts]
    }

    // Update cached objects
    // How do we invalidate cached queries?

    // Call backend and return results when
    // all the queries have been resolved

    const actions = inp.map(({URI, shape, data, invalidate}, index) => {
      return {URI, method, shape, data, cacheKey: index, invalidate}
    })

    return this.axios({
      method: 'post',
      withCredentials: true,
      url: this.API_URI,
      data: {
        actions
      }
    }).then((res) => {
      this._checkCookie(res)

      this._storeInCache(undefined, res.data)

      const result = actions.map((item) => {
        // Invalidate cached queries if passed a pathExpr to
        // resolve which items should be invalidated
        if (item.invalidate) {
          this.invalidateCache(item.invalidate)
        }

        return res.data[item.cacheKey]
      })
      return {
        result: wasArray ? result : result[0],
        data:  wasArray ? result.map((item) => item.body) : result[0].body // for compat
      }
    })
  }
  create (opts) {
    return this._mutation('create', opts)
  }

  update (opts) {
    return this._mutation('update', opts)
  }

  delete (opts) {
    return this._mutation('delete', opts)
  }
}

export default Client