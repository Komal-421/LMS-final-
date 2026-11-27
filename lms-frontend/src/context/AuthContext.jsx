import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUserRequest, loginRequest, logoutRequest } from '../api/authApi';

const AuthStateContext = createContext(null);
const AuthActionsContext = createContext(null);

export function AuthProvider({ children, onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async (signal) => {
    try {
      const currentUser = await getCurrentUserRequest(signal);
      if (currentUser?._id) {
        setUser(currentUser);
        return currentUser;
      }
      setUser(null);
      return null;
    } catch (error) {
      if (error.isCanceled) return null;
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCurrentUser(controller.signal);
    const handleUnauthorized = () => {
      setUser(null);
      onLogout?.();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      controller.abort();
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [loadCurrentUser, onLogout]);

  const login = useCallback(async (credentials) => {
    await loginRequest(credentials);
    const currentUser = await getCurrentUserRequest();
    if (!currentUser?._id) throw new Error('Failed to load authenticated user profile.');
    setUser(currentUser);
    return currentUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      onLogout?.();
    }
  }, [onLogout]);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    return loadCurrentUser();
  }, [loadCurrentUser]);

  const stateValue = useMemo(() => ({ user, loading, isAuthenticated: Boolean(user), role: user?.role ?? null }), [user, loading]);
  const actionsValue = useMemo(() => ({ login, logout, refreshUser, setUser }), [login, logout, refreshUser]);

  return (
    <AuthActionsContext.Provider value={actionsValue}>
      <AuthStateContext.Provider value={stateValue}>{children}</AuthStateContext.Provider>
    </AuthActionsContext.Provider>
  );
}

export function useAuthState() {
  const ctx = useContext(AuthStateContext);
  if (!ctx) throw new Error('useAuthState must be used within an AuthProvider');
  return ctx;
}

export function useAuthActions() {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) throw new Error('useAuthActions must be used within an AuthProvider');
  return ctx;
}

export function useAuth() {
  const state = useAuthState();
  const actions = useAuthActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
