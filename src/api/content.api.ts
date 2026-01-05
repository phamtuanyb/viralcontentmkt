import { supabase } from "@/integrations/supabase/client";

export interface Content {
  id: string;
  title: string;
  body: string;
  topic_id: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentWithTopic extends Content {
  topics: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export const contentApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("contents")
      .select(`
        *,
        topics (id, name, slug)
      `)
      .order("created_at", { ascending: false });

    return { data: data as ContentWithTopic[] | null, error };
  },

  getPublished: async () => {
    const { data, error } = await supabase
      .from("contents")
      .select(`
        *,
        topics (id, name, slug)
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    return { data: data as ContentWithTopic[] | null, error };
  },

  getByTopic: async (topicId: string) => {
    const { data, error } = await supabase
      .from("contents")
      .select(`
        *,
        topics (id, name, slug)
      `)
      .eq("topic_id", topicId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    return { data: data as ContentWithTopic[] | null, error };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("contents")
      .select(`
        *,
        topics (id, name, slug)
      `)
      .eq("id", id)
      .maybeSingle();

    return { data: data as ContentWithTopic | null, error };
  },

  getImages: async (contentId: string) => {
    const { data, error } = await supabase
      .from("content_images")
      .select("*")
      .eq("content_id", contentId)
      .order("sort_order", { ascending: true });

    return { data, error };
  },

  create: async (content: { title: string; body: string; topic_id?: string; thumbnail_url?: string; is_published?: boolean; created_by?: string }) => {
    const { data, error } = await supabase
      .from("contents")
      .insert([content])
      .select()
      .single();

    return { data, error };
  },

  update: async (id: string, content: Partial<Content>) => {
    const { data, error } = await supabase
      .from("contents")
      .update(content)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("contents")
      .delete()
      .eq("id", id);

    return { error };
  },

  logCopy: async (userId: string, contentId: string, actionType: string) => {
    await supabase
      .from("content_copy_logs")
      .insert({
        user_id: userId,
        content_id: contentId,
        action_type: actionType,
      });
  },
};
