import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('initializes with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('sets authentication info correctly', () => {
    const fakeUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      auth_provider: 'email_otp' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    useAuthStore.getState().setAuth(fakeUser, 'fake-token-123');

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('test@example.com');
    expect(state.token).toBe('fake-token-123');
    expect(state.isAuthenticated).toBe(true);
  });
});
