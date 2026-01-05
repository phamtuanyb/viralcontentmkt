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
    // Set session persistence based on rememberMe option
    // If rememberMe is false, the session will be stored in sessionStorage (cleared on tab close)
    // If rememberMe is true, the session will be stored in localStorage (persistent)
    if (!rememberMe) {
      // Store a flag to indicate session should not persist
      sessionStorage.setItem('supabase_session_only', 'true');
      localStorage.removeItem('supabase_session_only');
    } else {
      sessionStorage.removeItem('supabase_session_only');
      localStorage.setItem('supabase_session_only', 'false');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },
};
