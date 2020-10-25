function purgeWithShape (data, shape) {
  // Make sure we have a super fast path with nothing needs to be done
  if (shape === undefined || typeof data !== 'object' || data === null) {
    return data
  }

  let outp
  if (Array.isArray(data)) {
    // TODO: We need to handle array options 'myPropName[0-9]'
    // purge arrays
    outp = data.map((item) => purgeWithShape(item, shape))
  }
  else {
    // purge objects
    outp = {}

    const nextShape = shape.concat()
    const currentShape = nextShape.shift() 
  
    const allPrimitives = currentShape.indexOf('*') >= 0
    // TODO: We need to handle array options 'myPropName[0-9]'
    const allOmitted = currentShape.filter((t) => t.startsWith('!')).map((t) => t.substring(1))
    const allSelected = currentShape.filter((t) => !t.startsWith('!') && !t.startsWith('*'))
    for (let prop in data) {
      const val = data[prop]
      // Arrays are marked with suffix '[]'
      const propLookupName = Array.isArray(val) ?  prop + '[]' : prop
      // First check if this prop should be included in output
      if ((allPrimitives && allOmitted.indexOf(propLookupName) < 0) || allSelected.indexOf(propLookupName) >= 0) {
        // If the value is a primitive we just return it without expensive recursive call
        if (typeof val !== 'object' || val === null) {
          outp[prop] = val
        }
        // If it is and object/array we check nextShape isn't empty and filter for the next level.
        // Then we call purge recursively.
        else if (nextShape.length > 0) {
          // Decide the propshape for the next level
          const propShape = []
          if (Array.isArray(nextShape)) {
            for (const i in nextShape) {
              let tmpShape = nextShape[i]
              if (Array.isArray(tmpShape)) {
                propShape.push(
                  tmpShape.map((t) => {
                    const tmp = t.split('.')
                    if (tmp[0] === '*' || tmp[0] === propLookupName) {
                      return tmp.slice(1).join('.')
                    }
                    else {
                      return undefined
                    }
                  }).filter((t) => t)
                )
              }
            }
            outp[prop] = purgeWithShape(val, propShape)
          }
        }
      }
    }
  }
  return outp
}

module.exports = {
  purgeWithShape
}


const _L1 = [
  ["*"],
  ["order.*", "!order.orderRows[]"],
  ["order.*.*"],
]

const _L2 = [
  ["order.*", "!order.orderRows[]"],
  ["order.*.*"],
]