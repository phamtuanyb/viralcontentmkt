import { supabase } from "@/integrations/supabase/client";

export const authApi = {
  signUp: async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || "",
        },
      },
    });
    
    return { data, error };
  },

  signIn: async (email: string, password: string, rememberMe: boolean = false) => {
    // Set session persistence BEFORE signing in
    if (rememberMe) {
      // User wants persistent session
      localStorage.setItem('supabase_persist_session', 'true');
    } else {
      // User wants session-only (clear when browser closes)
      localStorage.setItem('supabase_persist_session', 'false');
    }
    
    // Mark session as active for current tab
    sessionStorage.setItem('supabase_active_session', 'true');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  },

  signOut: async () => {
    // Clear session markers
    localStorage.removeItem('supabase_persist_session');
    sessionStorage.removeItem('supabase_active_session');
    
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },
};
