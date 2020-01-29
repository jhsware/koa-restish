import assert from 'assert'
import axios from 'axios'
import { matchPath } from './matchPath'

const queryCache = {}

const objectCache = {}

function findObjects (inp) {
  let outp = []
  if (Array.isArray(inp)) {
    outp = outp.concat(inp
      .filter((key) => typeof inp[key] === 'object')
      .map((obj) => findObjects(obj)))
  } else if (typeof inp === 'object' && inp !== null) {
    if (inp._type && inp._id) {
      outp.push(inp)

    }
    outp = outp.concat(Object.keys(inp)
      .filter((key) => typeof inp[key] === 'object')
      .map((key) => findObjects(inp[key])))
  }
  return outp
}

function invalidateInQueryCache (cacheKeyExpr) {
  if (cacheKeyExpr === '*') {
    // Clear all data (used for logins)
    Object.keys(queryCache).forEach((key) => delete queryCache[key])
    Object.keys(objectCache).forEach((key) => delete objectCache[key])
    return 
  }
  if (!Array.isArray(cacheKeyExpr)) {
    cacheKeyExpr = [cacheKeyExpr]
  }

  const tmpClearKeys = Object.keys(queryCache).filter((key) => {
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
    delete queryCache[key]
  })
}

function storeInCache (cacheKey, data) {
  // Store entity objects in objectCache
  if (cacheKey) {
    queryCache[cacheKey] = data
  }

  findObjects(data).forEach((obj) => {
    if (objectCache[`${obj._type}.${obj._id}`]) {
      const cacheObj = objectCache[`${obj._type}.${obj._id}`]
      Object.keys(obj).forEach((key) => cacheObj[key] = obj[key])
    } else {
      objectCache[`${obj._type}.${obj._id}`] = obj
    }
  })
}

function fetchFromCache (cacheKey) {
  // TODO: Fetch entity objects from objectCache
  // TODO: Should I use shared pointer to keep them
  // updated or should I create new objects and
  // make sure network calls are performed first?
  return queryCache[cacheKey]
}


function _toCacheKey(inp) {
  if (Array.isArray(inp)) {
    const tmp = []
    for (var i = 0; i < inp.length; i++) {
      let val = _toCacheKey(inp[i])
      tmp.push(val)
    }
    return `[${tmp.join(',')}]`
  }
  else if (typeof inp === 'object') {
    const tmp = []
    const keys = Object.keys(inp).sort()
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      let val = _toCacheKey(inp[key])
      tmp.push(`${key}=${val}`)
    }
    return tmp.join('&')
  }
  else {
    return inp
  }
}

class Client {

  constructor(props) {
    this.API_URI = props.API_URI
    this.axios = props.axios || axios
  }

  invalidateCache (pathExp) {
    invalidateInQueryCache(pathExp)
  }

  query (opts) {
    let inp, wasArray
    if (Array.isArray(opts)) {
      inp = opts
      wasArray = true
    } else {
      inp = [opts]
    }

    const outp = []
    inp.map(({ URI, query, shape}) => {
      let queryCacheKey
      if (query) {
        assert(typeof query === 'object')
        queryCacheKey = _toCacheKey(query)
      }
      
      const cacheKey = URI + (queryCacheKey ? `?${queryCacheKey}` : '')
      if (queryCache.hasOwnProperty(cacheKey)) {
        // console.log('From CACHE....')

        // Check that all objects still exist and return result as resolved promise
        const { result } = fetchFromCache(cacheKey)
        return outp.push({URI, method: 'query', query, shape, result})
      }

      outp.push({URI, method: 'query', query, shape, cacheKey})
    })

    const actions = outp.filter((item) => item.cacheKey)

    // If everything is cached we can return it immediately
    if (actions.length === 0) {
      const result = outp.map((item) => item.result)
      return {
        data: wasArray ? result : result[0],
        status: 200
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
      // console.log('Request....')
      outp.forEach((item) => {
        if (item.cacheKey) {
          item.result = res.data[item.cacheKey]
          storeInCache(item.cacheKey, item)
          delete item.cacheKey
        }
      })

      const result = outp.map((item) => item.result)
      return {
        data: wasArray ? result : result[0],
        status: res.status
      }
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
      storeInCache(undefined, res.data)

      const result = actions.map((item) => {
        // Invalidate cached queries if passed a pathExpr to
        // resolve which items should be invalidated
        if (item.invalidate) {
          this.invalidateCache(item.invalidate)
        }

        return res.data[item.cacheKey]
      })
      return {
        data: wasArray ? result : result[0],
        status: res.status
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