import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ChildProfile, UserRecord, UserRole } from '../../shared/types';
import { api, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextValue {
  user: UserRecord | null;
  childrenList: ChildProfile[];
  activeChild: ChildProfile | null;
  loading: boolean;
  selectChild: (childId: string) => void;
  login: (email: string, password: string) => Promise<UserRecord>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    displayName?: string;
    ageGroup?: string;
  }) => Promise<UserRecord>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(
    () => localStorage.getItem('neurobloom_active_child')
  );
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setChildrenList([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setUser(data.user);
      setChildrenList(data.children);
      if (data.children.length > 0) {
        const storedMatches = data.children.some((c) => c.id === localStorage.getItem('neurobloom_active_child'));
        const nextId = storedMatches
          ? localStorage.getItem('neurobloom_active_child')!
          : data.children[0].id;
        setActiveChildId(nextId);
        localStorage.setItem('neurobloom_active_child', nextId);
      } else {
        setActiveChildId(null);
      }
    } catch {
      setStoredToken(null);
      setUser(null);
      setChildrenList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string): Promise<UserRecord> => {
    const res = await api.login(email, password);
    setStoredToken(res.token);
    await refreshAuth();
    return res.user;
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    displayName?: string;
    ageGroup?: string;
  }): Promise<UserRecord> => {
    const res = await api.register(payload);
    setStoredToken(res.token);
    await refreshAuth();
    return res.user;
  };

  const logout = () => {
    setStoredToken(null);
    localStorage.removeItem('neurobloom_active_child');
    setUser(null);
    setChildrenList([]);
    setActiveChildId(null);
  };

  const selectChild = (childId: string) => {
    setActiveChildId(childId);
    localStorage.setItem('neurobloom_active_child', childId);
  };

  const activeChild = childrenList.find((c) => c.id === activeChildId) || childrenList[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        childrenList,
        activeChild,
        loading,
        selectChild,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
