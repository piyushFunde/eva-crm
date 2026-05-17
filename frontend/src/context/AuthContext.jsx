import { createContext, useState, useCallback, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('eva_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  // Mock login — will be replaced with real API in Phase 2
  const login = useCallback(async (username, password) => {
    setLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));

    // Mock validation
    if (!username || !password) {
      setLoading(false);
      throw new Error('Username and password are required');
    }

    // Mock user data
    const mockUser = {
      id: 1,
      name: username === 'admin' ? 'Admin User' : 'Rajesh Kumar',
      username,
      role: username === 'admin' ? 'admin' : 'executive',
      email: `${username}@evagroups.in`,
    };

    localStorage.setItem('eva_user', JSON.stringify(mockUser));
    localStorage.setItem('eva_token', 'mock-jwt-token-' + Date.now());
    setUser(mockUser);
    setLoading(false);
    return mockUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('eva_user');
    localStorage.removeItem('eva_token');
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
