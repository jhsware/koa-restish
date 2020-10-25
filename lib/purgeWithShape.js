/**
 * Purge data to limit output based on passed shape.
 * @param {Object} data input data
 * @param {Object} shape= a nested shape object that defines what output should look like
 */
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
      // First check if this prop should be included in output
      if ((allPrimitives && allOmitted.indexOf(prop) < 0) || allSelected.indexOf(prop) >= 0) {
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
                    if (tmp[0] === '*' || tmp[0] === prop) {
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

/**
 * Convert a more readable flat shape list to a nested shape object that
 * can be passed to purgeWithShape. See README.md for examples of flat
 * shape lists.
 * @param {(String|String[])} flatShape
 * @returns Object
 */
function createNestedShape(flatShape) {
  // Make sure we have a super fast path with nothing needs to be done
  if (flatShape === undefined) {
    return undefined
  }

  // Make sure we have an arrays
  let flatshapeIn = flatShape
  if (typeof flatshapeIn === 'string') {
    flatshapeIn = [flatshapeIn]
  }

  const outp = []
  flatshapeIn.forEach((t) => {
    const tmp = t.split('.')
    tmp.forEach((p, index) => {
      const sub = tmp.slice(0, index + 1).join('.')
      const wildcard = tmp.slice(0, index).concat(['*']).join('.')
      // Make sure the level at least has an empty array
      if (outp[index] === undefined) {
        outp[index] = []
      }
      // Create an entry for the nested shape
      if (outp[index].indexOf(sub) < 0 && (
        // If this is a partial expression and a wildcard match exists we can skip it
        outp[index].indexOf(wildcard) < 0 ||
        // But full expressions should always be added
        index == tmp.length - 1
      )) {
        outp[index].push(sub)
      }
    })
  })
  return outp
}

module.exports = {
  purgeWithShape,
  createNestedShape
}
