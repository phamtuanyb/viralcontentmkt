import { supabase } from "@/integrations/supabase/client";

export interface Comment {
  id: string;
  content_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const commentsApi = {
  getByContentId: async (contentId: string) => {
    const { data, error } = await supabase
      .from("content_comments")
      .select(`
        *,
        user:users(full_name, avatar_url)
      `)
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });

    return { data: data as Comment[] | null, error };
  },

  create: async (contentId: string, userId: string, comment: string) => {
    const { data, error } = await supabase
      .from("content_comments")
      .insert({ content_id: contentId, user_id: userId, comment })
      .select(`
        *,
        user:users(full_name, avatar_url)
      `)
      .single();

    return { data: data as Comment | null, error };
  },

  update: async (id: string, comment: string) => {
    const { data, error } = await supabase
      .from("content_comments")
      .update({ comment })
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("content_comments")
      .delete()
      .eq("id", id);

    return { error };
  },
};
