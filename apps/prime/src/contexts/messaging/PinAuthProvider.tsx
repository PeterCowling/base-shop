'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PinAuthContextValue {
  user: { id: string } | null;
  role: 'guest' | 'staff' | 'admin' | 'owner' | null;
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
}

const PinAuthContext = createContext<PinAuthContextValue | null>(null);

export function PinAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [role, setRole] = useState<'guest' | 'staff' | 'admin' | 'owner' | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedRole = localStorage.getItem('prime_role');
    const storedUserId = localStorage.getItem('prime_user_id');
    if (storedRole && storedUserId) {
      setRole(storedRole as 'guest' | 'staff' | 'admin' | 'owner');
      setUser({ id: storedUserId });
    }
  }, []);

  async function login(pin: string): Promise<boolean> {
    // TODO: Implement actual PIN authentication
    // For now, accept any 4+ digit PIN as staff
    if (pin.length >= 4) {
      const userId = `user_${Date.now()}`;
      setUser({ id: userId });
      setRole('staff');
      localStorage.setItem('prime_role', 'staff');
      localStorage.setItem('prime_user_id', userId);
      return true;
    }
    return false;
  }

  function logout() {
    setUser(null);
    setRole(null);
    localStorage.removeItem('prime_role');
    localStorage.removeItem('prime_user_id');
  }

  return (
    <PinAuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </PinAuthContext.Provider>
  );
}

export function usePinAuth() {
  const context = useContext(PinAuthContext);
  if (!context) {
    throw new Error('usePinAuth must be used within a PinAuthProvider');
  }
  return context;
}
