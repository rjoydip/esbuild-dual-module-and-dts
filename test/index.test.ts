import { describe, expect, it } from 'vitest'
import { getBarAsync, getFooAsync, one, two } from '../src'

describe('should', () => {
  it('vlidate values', () => {
    expect(one).toEqual(1)
    expect(two).toEqual(2)
  })
  it('validate values od getFooAsync methods', async () => {
    expect(await getFooAsync()).toEqual('foo')
  })
  it('validate values od getBarAsync methods', async () => {
    expect(await getBarAsync()).toEqual('bar')
  })
})
