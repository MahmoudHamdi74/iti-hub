import { test, expect, vi, afterEach } from 'vitest';
import { registerGoogleIdentity } from '../src/lib/googleIdentity';
const io = vi.hoisted(() => vi.fn((url, options) => ({
  auth: options.auth, connected: false, on: vi.fn(), removeAllListeners: vi.fn(), close: vi.fn(), io: { on: vi.fn() },
})));
vi.mock('socket.io-client', () => ({ io }));
import { initializeSocket, disconnectSocket } from '../src/lib/socket';
afterEach(() => { disconnectSocket(); vi.clearAllMocks(); vi.unstubAllEnvs(); });
test('Google initializes once across login/register mounts and uses current callbacks', () => {
  const api = { initialize: vi.fn() };
  const login = { success: vi.fn(), error: vi.fn() };
  const first = registerGoogleIdentity(api, 'client-id', login);
  first.release();
  const signup = { success: vi.fn(), error: vi.fn() };
  const second = registerGoogleIdentity(api, 'client-id', signup);
  expect(api.initialize).toHaveBeenCalledTimes(1);
  expect(api.initialize.mock.calls[0][0].use_fedcm_for_button).toBe(true);
  api.initialize.mock.calls[0][0].callback({ credential: 'test-credential' });
  expect(signup.success).toHaveBeenCalledWith('test-credential');
  expect(login.success).not.toHaveBeenCalled();
  second.release();
});
test('simultaneous socket consumers reuse the pending connection and use API origin', () => {
  vi.stubEnv('VITE_SOCKET_URL', '');
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api');
  const first = initializeSocket('session-one');
  expect(initializeSocket('session-one')).toBe(first);
  expect(io).toHaveBeenCalledTimes(1);
  expect(io.mock.calls[0][0]).toBe('https://api.example.com');
  expect(first.close).not.toHaveBeenCalled();
  initializeSocket('session-two');
  expect(first.close).toHaveBeenCalledTimes(1);
  expect(io).toHaveBeenCalledTimes(2);
});
