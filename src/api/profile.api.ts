import { supabase } from "@/integrations/supabase/client";

export const profileApi = {
  updateProfile: async (userId: string, data: { phone_number?: string; signature_text?: string }) => {
    const { data: result, error } = await supabase
      .from("user_profiles")
      .update(data)
      .eq("user_id", userId)
      .select()
      .single();

    return { data: result, error };
  },

  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return { data, error };
  },
};
