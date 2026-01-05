import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "editor" | "sales";
export type UserStatus = "pending" | "active" | "suspended";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: UserStatus;
  phone_number: string | null;
  signature_text: string | null;
  gemini_api_key: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: AppRole[];
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setRoles: (roles: AppRole[]) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
  isAdmin: () => boolean;
  isEditor: () => boolean;
  isSales: () => boolean;
  isActive: () => boolean;
  isPending: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  roles: [],
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setRoles: (roles) => set({ roles }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, session: null, profile: null, roles: [], isLoading: false }),
  isAdmin: () => get().roles.includes("admin"),
  isEditor: () => get().roles.includes("editor"),
  isSales: () => get().roles.includes("sales"),
  isActive: () => get().profile?.status === "active",
  isPending: () => get().profile?.status === "pending",
}));
