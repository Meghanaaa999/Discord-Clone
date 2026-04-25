import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, loginUser, registerUser } from "../services/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "chat_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getMe(token);
        if (isMounted) {
          setUser(response.user);
        }
      } catch (_error) {
        if (isMounted) {
          setToken("");
          setUser(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      async login(credentials) {
        const response = await loginUser(credentials);
        localStorage.setItem(TOKEN_KEY, response.token);
        setToken(response.token);
        setUser(response.user);
      },
      async register(credentials) {
        const response = await registerUser(credentials);
        localStorage.setItem(TOKEN_KEY, response.token);
        setToken(response.token);
        setUser(response.user);
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
      },
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
