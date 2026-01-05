import { supabase } from "@/integrations/supabase/client";

export interface SocialLink {
  id: string;
  user_id: string;
  platform: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export const socialLinksApi = {
  getByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from("user_social_links")
      .select("*")
      .eq("user_id", userId)
      .order("platform");

    return { data: data as SocialLink[] | null, error };
  },

  upsert: async (userId: string, platform: string, url: string) => {
    const { data, error } = await supabase
      .from("user_social_links")
      .upsert(
        { user_id: userId, platform, url },
        { onConflict: "user_id,platform" }
      )
      .select()
      .single();

    return { data: data as SocialLink | null, error };
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("user_social_links")
      .delete()
      .eq("id", id);

    return { error };
  },
};
