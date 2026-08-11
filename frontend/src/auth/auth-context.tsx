import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { jwtAuthAdapter, setSessionFromToken } from "./jwt-auth-adapter";
import type { AuthProviderAdapter, Credentials, Permission, Session } from "./types";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: Status;
  session: Session | null;
  can: (permission: Permission) => boolean;
  signIn: (credentials: Credentials) => Promise<Session>;
  signUp: (credentials: Credentials) => Promise<Session>;
  authenticateToken: (token: string) => Promise<Session>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  adapter = jwtAuthAdapter,
}: {
  children: ReactNode;
  adapter?: AuthProviderAdapter;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;
    adapter.restore().then((restored) => {
      if (!active) return;
      setSession(restored);
      setStatus(restored ? "authenticated" : "unauthenticated");
    });
    return () => {
      active = false;
    };
  }, [adapter]);

  const signIn = useCallback(
    async (credentials: Credentials) => {
      const next = await adapter.signIn(credentials);
      setSession(next);
      setStatus("authenticated");
      return next;
    },
    [adapter],
  );

  const signUp = useCallback(
    async (credentials: Credentials) => {
      const next = await adapter.signUp(credentials);
      setSession(next);
      setStatus("authenticated");
      return next;
    },
    [adapter],
  );

  const authenticateToken = useCallback(async (token: string) => {
    const next = await setSessionFromToken(token);
    setSession(next);
    setStatus("authenticated");
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await adapter.signOut();
    setSession(null);
    setStatus("unauthenticated");
  }, [adapter]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      can: (permission) => !!session?.permissions.includes(permission),
      signIn,
      signUp,
      authenticateToken,
      signOut,
    }),
    [status, session, signIn, signUp, authenticateToken, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
