import { describe, expect, it } from 'vitest'
import { validateRegistration } from './validation'
import type { RegistrationInput } from './types'

const valid: RegistrationInput = { firstName: 'Léa', lastName: 'Martin', email: 'lea.martin@example.com', postalCode: '01400', adults: 0, children: 0, consent: true }

describe('validateRegistration', () => {
  it('accepts a valid form including zero people', () => { expect(validateRegistration(valid)).toEqual({}) })
  it('requires name, first name, email, postal code, and consent', () => {
    expect(validateRegistration({ ...valid, lastName: '', firstName: ' ', email: '', postalCode: '', consent: false })).toMatchObject({ lastName: expect.any(String), firstName: expect.any(String), email: expect.any(String), postalCode: expect.any(String), consent: expect.any(String) })
  })
  it('rejects malformed email and postal codes', () => {
    expect(validateRegistration({ ...valid, email: 'lea.martin', postalCode: '14A00' })).toMatchObject({ email: expect.any(String), postalCode: expect.any(String) })
  })
  it('accepts a five digit postal code with a leading zero', () => { expect(validateRegistration({ ...valid, postalCode: '01400' }).postalCode).toBeUndefined() })
  it('rejects negative or fractional group counts', () => {
    expect(validateRegistration({ ...valid, adults: -1, children: 1.5 })).toMatchObject({ adults: expect.any(String), children: expect.any(String) })
  })
})
