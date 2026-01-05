import { useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { usersApi } from "@/api/users.api";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { setUser, setSession, setProfile, setRoles, setIsLoading } = useAuthStore();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile/roles fetch
        if (session?.user) {
          setTimeout(async () => {
            const profile = await usersApi.getProfile(session.user.id);
            const roles = await usersApi.getRoles(session.user.id);
            setProfile(profile);
            setRoles(roles);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profile = await usersApi.getProfile(session.user.id);
        const roles = await usersApi.getRoles(session.user.id);
        setProfile(profile);
        setRoles(roles);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setProfile, setRoles, setIsLoading]);

  return <>{children}</>;
};
