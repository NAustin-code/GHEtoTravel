import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { User } from "@/types/declaration";
import { clearAuthState, getAuthToken, CACHED_USER_KEY } from "@/services/httpClient";
import { fetchCurrentUser } from "./authService";

interface UserContextValue {
  user: User | null;
  setUser: (u: User | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timedOut = false;
    const done = () => { if (mounted) setLoading(false); };
    const token = getAuthToken();
    if (!token) {
      localStorage.removeItem(CACHED_USER_KEY);
      done();
      return;
    }
    const cached = localStorage.getItem(CACHED_USER_KEY);
    if (cached) {
      try {
        if (mounted) setUser(JSON.parse(cached));
      } catch {
        localStorage.removeItem(CACHED_USER_KEY);
      }
      done();
    }
    // Session restore is local and should resolve instantly; the timeout only
    // guards against a stalled main thread. A timeout must never destroy a
    // valid session, so it only unblocks rendering — reconciliation below
    // still runs when the lookup completes.
    const timer = setTimeout(() => {
      timedOut = true;
      done();
    }, 8000);
    fetchCurrentUser().then((u) => {
      clearTimeout(timer);
      if (!mounted) return;
      if (u) {
        setUser(u);
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(u));
      } else {
        setUser(null);
        clearAuthState();
      }
      done();
    }).catch(() => {
      clearTimeout(timer);
      if (!mounted || timedOut) {
        // Post-timeout failure: leave the cached session alone.
        done();
        return;
      }
      setUser(null);
      clearAuthState();
      done();
    });
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const persistUser = useCallback((u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(CACHED_USER_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearAuthState();
  }, []);

  const ctxValue = useMemo(() => ({ user, setUser: persistUser, isAuthenticated: !!user, logout }), [user, persistUser, logout]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <UserContext.Provider value={ctxValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
