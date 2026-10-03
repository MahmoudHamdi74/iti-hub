import React from 'react';
import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RouteShell from '../src/layout/RouteShell';
import ProtectedRoute from '../src/components/routes/ProtectedRoute';
import useRequireAuth, { useLoginModalStore } from '../src/hooks/useRequireAuth';
import { useAuthStore } from '../src/store/auth';

vi.mock('react-intlayer', () => ({ useIntlayer: () => ({
  title: 'Login required', message: 'Please sign in', loginButton: 'Login', registerButton: 'Register', cancel: 'Cancel',
}) }));
function Home() {
  const { requireAuth } = useRequireAuth();
  return <button onClick={() => requireAuth()}>Use feature</button>;
}
function setup(path = '/') {
  useAuthStore.setState({ isAuthenticated: false, token: null });
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route element={<RouteShell />}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<h1>Login page</h1>} />
      <Route path="/register" element={<h1>Register page</h1>} />
      <Route element={<ProtectedRoute />}><Route path="/messages" element={<h1>Private messages</h1>} /></Route>
    </Route>
  </Routes></MemoryRouter>);
}
afterEach(() => { cleanup(); useLoginModalStore.getState().closeModal(); });
test.each(['Login', 'Register'])('guest action opens prompt and %s navigates', async action => {
  setup();
  fireEvent.click(screen.getByText('Use feature'));
  expect(await screen.findByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: action, exact: true }));
  expect(await screen.findByRole('heading', { name: `${action} page` })).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
});
test('direct private URL prompts a guest without rendering private content', async () => {
  setup('/messages');
  expect(await screen.findByRole('dialog')).toBeTruthy();
  expect(screen.queryByText('Private messages')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Login', exact: true }));
  expect(await screen.findByText('Login page')).toBeTruthy();
});
