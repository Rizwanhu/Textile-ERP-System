import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthUser = {
  name: string;
  email: string;
  role: "Owner" | "Manager" | "Operator" | "Viewer";
};

type AuthCtx = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "textileerp.auth.user";
const Ctx = createContext<AuthCtx | null>(null);

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login: AuthCtx["login"] = async (email, password) => {
    if (!email || !password) throw new Error("Email and password are required.");
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setUser({ name: name || "Operator", email, role: "Owner" });
  };

  const signup: AuthCtx["signup"] = async (name, email, password) => {
    if (!name || !email || !password) throw new Error("All fields are required.");
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    setUser({ name, email, role: "Owner" });
  };

  const logout = () => setUser(null);

  return (
    <Ctx.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "U";
}