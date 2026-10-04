import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RegisterController from '../src/pages/auth/RegisterController';
const mocks = vi.hoisted(() => ({ register: vi.fn(), email: vi.fn() }));
vi.mock('react-intlayer', () => ({ useIntlayer: () => new Proxy({}, { get: (_, key) => String(key) }) }));
vi.mock('@components/common', () => ({ Card: ({ children }) => <div>{children}</div>, ErrorDisplay: () => null }));
vi.mock('@hooks/mutations/useRegister', () => ({ useRegister: () => ({ mutate: mocks.register }) }));
vi.mock('@hooks/mutations/useCheckEmailAvailability', () => ({ useCheckEmailAvailability: () => ({ mutate: mocks.email }) }));
vi.mock('@hooks/mutations/useCheckUsernameAvailability', () => ({ useCheckUsernameAvailability: () => ({ mutate: vi.fn() }) }));
vi.mock('@hooks/mutations/useGoogleAuth', () => ({ useGoogleAuth: () => ({ mutate: vi.fn() }) }));
vi.mock('@components/auth/RegisterStepOne', () => ({ default: p => <><button onClick={() => p.onChange({ email: 'test@example.test' })}>Email</button><button onClick={p.onNext}>Next email</button><span>{p.errors.email}</span></> }));
vi.mock('@components/auth/RegisterStepTwo', () => ({ default: p => <><button onClick={() => p.onChange({ username: 'tester' })}>Username</button><button onClick={p.onNext}>Next username</button><span>{p.errors.username}</span></> }));
vi.mock('@components/auth/RegisterStepThree', () => ({ default: p => <><button onClick={() => p.onChange({ firstName: 'Test', lastName: 'User', password: 'Password123!', confirmPassword: 'Password123!' })}>Profile</button><button onClick={p.onSubmit}>Register</button></> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });
const renderForm = () => render(<MemoryRouter><Routes><Route path="/" element={<RegisterController />} /><Route path="/verify-otp" element={<p>Verify account</p>} /></Routes></MemoryRouter>);
const submitForm = () => {
  mocks.email.mockImplementation((_, options) => options.onSuccess({ data: { data: { available: true } } }));
  renderForm();
  for (const text of ['Email', 'Next email', 'Username', 'Next username', 'Profile', 'Register']) fireEvent.click(screen.getByText(text));
};
test.each([['USERNAME_EXISTS', 'errorUsernameTaken'], ['EMAIL_EXISTS', 'errorEmailTaken']])('registration handles %s from the server', (code, label) => {
  mocks.register.mockImplementation((_, options) => options.onError({ response: { data: { error: { code } } } }));
  submitForm();
  expect(screen.getByText(label)).toBeTruthy();
});
test('an existing unverified account continues to OTP rather than a registration conflict', () => {
  mocks.email.mockImplementation((_, options) => options.onSuccess({ data: { data: { available: false, requiresVerification: true } } }));
  renderForm(); fireEvent.click(screen.getByText('Email')); fireEvent.click(screen.getByText('Next email'));
  expect(screen.getByText('Verify account')).toBeTruthy();
  expect(mocks.register).not.toHaveBeenCalled();
});
