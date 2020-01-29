module.exports = function (api) {

  api.cache.using(() => process.env.TARGET === 'server' ? 'server' : 'client')

  console.log(process.env.TARGET)

  let targets
  if (process.env.TARGET === 'server') {
    targets = {
      "node": "current"
    }
  } else {
    targets = {
      "node": "current",
      "browsers": ["last 3 versions", "ie >= 11"]
    }
  }

  return {
    "presets": [
      ["@babel/preset-env", {
        targets
      }]
    ]
  }

}
