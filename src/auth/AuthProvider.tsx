import { useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { usersApi } from "@/api/users.api";

interface AuthProviderProps {
  children: ReactNode;
}

// Check if session should be cleared on page load (session-only mode)
const shouldClearSession = () => {
  const sessionOnly = sessionStorage.getItem('supabase_session_only');
  const persistFlag = localStorage.getItem('supabase_session_only');
  
  // If sessionStorage flag exists, user wants session-only mode
  // If localStorage flag is 'false', user chose "remember me"
  // If neither exists and we're starting fresh, check if there's a session without remember flag
  if (persistFlag === 'false') {
    return false; // User chose to remember, don't clear
  }
  
  if (sessionOnly === 'true') {
    return false; // Session is active in current tab
  }
  
  // If no flags at all, this might be a new tab/window
  // Check if there was a previous session without remember me
  if (!persistFlag && !sessionOnly) {
    // No remember me was set, clear session on new browser session
    return true;
  }
  
  return false;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { setUser, setSession, setProfile, setRoles, setIsLoading } = useAuthStore();

  useEffect(() => {
    // Check if we should clear session on page load (non-persistent session)
    const clearOnLoad = shouldClearSession();
    
    if (clearOnLoad) {
      supabase.auth.signOut().then(() => {
        setUser(null);
        setSession(null);
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
      });
      return;
    }
    
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
