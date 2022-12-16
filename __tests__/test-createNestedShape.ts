import { describe, expect, it } from "@jest/globals";
import { createNestedShape } from '../src/purgeWithShape';

describe("create nested shape", () => {

  describe("return entire object", () => {
    it("Anything", async function () {
      const tmp = createNestedShape()
      expect(tmp).toEqual(undefined)
    })
    it("First level", async function () {
      const tmp = createNestedShape('*')
      const outp = [['*']]
      expect(JSON.stringify(tmp)).toEqual(JSON.stringify(outp))
    })
    it("Three levels", async function () {
      const tmp = createNestedShape('*.*.*')
      const outp = [['*'], ['*.*'], ['*.*.*']]
      expect(JSON.stringify(tmp)).toEqual(JSON.stringify(outp))
    })
    it("All primites of order", async function () {
      const tmp = createNestedShape([
        '*',
        'order.*'
      ])
      const outp = [
        ['*'],
        ['order.*']
      ]
      expect(JSON.stringify(tmp)).toEqual(JSON.stringify(outp))
    })
    it("More specific translation of order with omit", async function () {
      const tmp = createNestedShape([
        "*",
        "order.*.*",
        "order.!orderRows[]",
      ])
      const outp = [
        ['*'],
        ['order.*', 'order.!orderRows[]'],
        ['order.*.*']
      ]
      expect(JSON.stringify(tmp)).toEqual(JSON.stringify(outp))
    })
    /*
    it("More specific translation of order with array options", async function () {
      const tmp = createNestedShape([
        "*",
        "order.*.*",
        "order.orderRows[0-9]",
      ])
      const outp = [
        ['*'],
        ['order.*', 'order.orderRows[0-9]'],
        ['order.*.*']
      ]
      expect(JSON.stringify(tmp)).toEqual(JSON.stringify(outp))
    })
    */
    it("Very specific translation of order", async function () {
      const tmp = createNestedShape([
        "discountCode",
        "firstRow",
        "order",
        "order.orderDate",
        "order.orderCurrency",
        "order.orderRows[]",
        "order.orderRows[].itemDescription",
        "order.orderRows[].sku",
        "order.orderRows[].qty",
      ])
      const outp = [
        ['discountCode', 'firstRow', 'order'],
        ['order.orderDate', 'order.orderCurrency', 'order.orderRows[]'],
        ['order.orderRows[].itemDescription', 'order.orderRows[].sku', 'order.orderRows[].qty']
      ]
      expect(JSON.stringify(tmp)).toEqual(JSON.stringify(outp))
    })
  })  
})
