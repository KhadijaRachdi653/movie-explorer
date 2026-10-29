"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type UserType = {
  name: string;
  email: string;
};

type UserContextValue = {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        if (session?.user) {
          setUser({ name: session.user.name, email: session.user.email });
        }
      } catch (err) {
        setUser(null);
      }
    }
    fetchSession();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser doit être utilisé à l'intérieur d'un UserProvider");
  }
  return context;
}
