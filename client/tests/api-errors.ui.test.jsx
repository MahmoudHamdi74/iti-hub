import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import ErrorDisplay from '../src/components/common/ErrorDisplay';
afterEach(cleanup);

test('shows API conflict details instead of the Axios 409 wrapper', () => {
  render(<ErrorDisplay error={{ message: 'Request failed with status code 409', code: 'ERR_BAD_REQUEST', response: { data: { error: { code: 'EMAIL_EXISTS', message: 'Email is already registered' } } } }} />);
  expect(screen.getByText('Email is already registered')).toBeTruthy();
  expect(screen.queryByText(/ERR_BAD_REQUEST/)).toBeNull();
});

test('renders error pages which pass a message instead of an error object', () => {
  render(<ErrorDisplay message="This post was removed" />);
  expect(screen.getByRole('alert').textContent).toContain('This post was removed');
});
