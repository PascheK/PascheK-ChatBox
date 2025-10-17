"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type User = {
  id: number;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
} | null;

type UserContextType = {
  user: User;
  setUser: (user: User) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: User;
  children: ReactNode;
}) {
  const [user, setUser] = useState<User>(initialUser);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
