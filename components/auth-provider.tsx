"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, isFirebaseConfigured } from "@/lib/firebase-client";

type AuthState = { user: User | null; loading: boolean; token: () => Promise<string | null> };
const AuthContext = createContext<AuthState>({ user: null, loading: true, token: async () => null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    }, () => {
      setUser(null);
      setLoading(false);
    });
  }, []);
  const value = useMemo(() => ({ user, loading, token: () => user?.getIdToken() ?? Promise.resolve(null) }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
