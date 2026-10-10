import { test, expect } from 'vitest';
import { getSeo, publicPages } from '../src/lib/seo';

test('public directory pages have unique titles and canonical URLs', () => {
  expect(new Set(Object.keys(publicPages).map(path => getSeo(path).title)).size).toBe(Object.keys(publicPages).length);
  expect(getSeo('/branches/').canonical).toBe('https://www.itihub.tech/branches');
  expect(getSeo('/communities').robots).toBe('index, follow');
});
test.each(['/login', '/verify-otp', '/password-reset/confirm', '/settings', '/messages/123', '/unknown'])('%s must not be indexed', path => {
  expect(getSeo(path).robots).toBe('noindex, follow');
});
