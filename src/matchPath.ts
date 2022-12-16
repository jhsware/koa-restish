import pathToRegexp from 'path-to-regexp-es6';

const patternCache = {};
const cacheLimit = 10000;
let cacheCount = 0;

const compilePath = (pattern, options) => {
  const cacheKey = Object.values(options).join('');
  const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {});

  if (cache[pattern]) {
    return cache[pattern];
  }

  const keys = [];
  const re = pathToRegexp(pattern, keys, options);
  const compiledPattern = { re, keys };

  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledPattern;
    cacheCount++;
  }

  return compiledPattern;
};

/**
 * Public API for matching a URL pathname to a path pattern.
 */
type TMatch = {
  isExact: boolean;
  params: any;
  path: any;
  url: any;
  handler?: Function;
}

export function matchPath(pathname, options): TMatch {
  if (typeof options === 'string') {
    options = { path: options };
  }

  const {
    path = '/', // The path to be tested
    exact = true, // Should we allow prefix matches or not
    sensitive = false, // Do case sensitive match
    exclude // Don't match paths with this string prefix
  } = options;
  if (pathname.startsWith(exclude)) {
    return null
  }

  const { re, keys } = compilePath(path, { end: exact, start: true, sensitive });
  const match = re.exec(pathname);

  if (!match) {
    return null;
  }

  const [url, ...values] = match;
  const isExact = pathname === url;

  if (exact && !isExact) {
    return null;
  }

  return {
    isExact, // whether or not we matched exactly
    params: keys.reduce((memo, key, index) => {
      memo[key.name] = values[index];
      return memo;
    }, {}),
    path, // the path pattern used to match
    url: path === '/' && url === '' ? '/' : url // the matched portion of the URL
  };
}