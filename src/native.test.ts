import { describe, expect, it } from 'vitest'
import { isNativeApp } from './native.ts'
import { canSendCard } from './share/shareCard.ts'

describe('native shell', () => {
  it('is not a store app inside unit tests', () => {
    expect(isNativeApp()).toBe(false)
  })

  it('hides SEND CARD when the browser has no share sheet', () => {
    expect(canSendCard()).toBe(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  })
})
