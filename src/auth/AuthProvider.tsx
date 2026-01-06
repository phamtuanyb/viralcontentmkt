import { useEffect, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { usersApi } from "@/api/users.api";

interface AuthProviderProps {
  children: ReactNode;
}

// Check if session should be cleared on page load (session-only mode)
const shouldClearSession = () => {
  // Check if user has opted for persistent session
  const persistSession = localStorage.getItem('supabase_persist_session');
  
  // If persist_session is 'true', don't clear
  if (persistSession === 'true') {
    return false;
  }
  
  // If persist_session is 'false' or not set, check sessionStorage
  // sessionStorage persists within the same tab/window session
  const activeSession = sessionStorage.getItem('supabase_active_session');
  
  // If there's an active session marker in sessionStorage, don't clear
  if (activeSession === 'true') {
    return false;
  }
  
  // If persist is explicitly 'false' and no active session marker, clear
  if (persistSession === 'false') {
    return true;
  }
  
  return false;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { setUser, setSession, setProfile, setRoles, setIsLoading } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initialized.current) return;
    initialized.current = true;
    
    // Check if we should clear session on page load (non-persistent session)
    const clearOnLoad = shouldClearSession();
    
    if (clearOnLoad) {
      supabase.auth.signOut().then(() => {
        setUser(null);
        setSession(null);
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
        // Clear persist flag after sign out
        localStorage.removeItem('supabase_persist_session');
      });
      return;
    }
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Update session and user immediately (synchronously)
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile/roles fetch with setTimeout to prevent deadlock
        if (session?.user) {
          // Mark session as active in sessionStorage
          sessionStorage.setItem('supabase_active_session', 'true');
          
          setTimeout(async () => {
            try {
              const profile = await usersApi.getProfile(session.user.id);
              const roles = await usersApi.getRoles(session.user.id);
              setProfile(profile);
              setRoles(roles);
            } catch (error) {
              console.error('Error fetching profile/roles:', error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          // Clear session markers on sign out
          sessionStorage.removeItem('supabase_active_session');
          setProfile(null);
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Only update if no auth state change has occurred yet
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        sessionStorage.setItem('supabase_active_session', 'true');
        
        try {
          const profile = await usersApi.getProfile(session.user.id);
          const roles = await usersApi.getRoles(session.user.id);
          setProfile(profile);
          setRoles(roles);
        } catch (error) {
          console.error('Error fetching profile/roles:', error);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setProfile, setRoles, setIsLoading]);

  return <>{children}</>;
};
