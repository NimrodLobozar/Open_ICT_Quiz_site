import { describe, expect, it } from 'vitest'
import { deviceLabel } from '../auth/deviceLabel.js'

// Echte User-Agents van gangbare browsers.
const UA = {
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  android:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  windowsChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  windowsEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0',
  macFirefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:125.0) Gecko/20100101 Firefox/125.0',
}

// USER IMPLEMENTATION S9 — backend/auth/deviceLabel.js
describe('apparaatlabel (S9)', () => {
  it.each([
    ['iphone', 'Telefoon · Safari'],
    ['android', 'Telefoon · Chrome'],
    ['ipad', 'Tablet · Safari'],
    ['windowsChrome', 'Computer · Chrome'],
    ['windowsEdge', 'Computer · Edge'],
    ['macFirefox', 'Computer · Firefox'],
  ])('%s → %s', (key, expected) => {
    expect(deviceLabel(UA[key])).toBe(expected)
  })

  it('zonder User-Agent: "Onbekend apparaat"', () => {
    expect(deviceLabel(undefined)).toBe('Onbekend apparaat')
    expect(deviceLabel('')).toBe('Onbekend apparaat')
  })

  it('een onbekende browser: alleen het soort apparaat', () => {
    expect(deviceLabel('curl/8.0')).toBe('Computer')
  })
})
