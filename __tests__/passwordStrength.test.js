const { computeStrength } = require('../lib/passwordStrength')

describe('password strength', () => {
  test('rejects weak passwords', () => {
    const s = computeStrength('abc')
    expect(s.score).toBeLessThan(5)
  })
  test('accepts strong passwords', () => {
    const s = computeStrength('Abcd1234!')
    expect(s.score).toBeGreaterThanOrEqual(5)
  })
})