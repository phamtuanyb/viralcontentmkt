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
  view_count: number;
}

export interface ContentWithTopic extends Content {
  topics: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export type SortOption = "newest" | "oldest" | "popular" | "views";

export interface ContentWithCopyCount extends ContentWithTopic {
  copy_count?: number;
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

  getPublished: async (sortBy: SortOption = "newest") => {
    // For "popular" sorting, we need to get copy counts and sort manually
    if (sortBy === "popular") {
      // First get all published contents
      const { data: contents, error: contentsError } = await supabase
        .from("contents")
        .select(`
          *,
          topics (id, name, slug)
        `)
        .eq("is_published", true);

      if (contentsError || !contents) {
        return { data: null, error: contentsError };
      }

      // Get copy counts for each content
      const { data: copyCounts, error: copyError } = await supabase
        .from("content_copy_logs")
        .select("content_id");

      if (copyError) {
        return { data: null, error: copyError };
      }

      // Count copies per content
      const copyCountMap: Record<string, number> = {};
      copyCounts?.forEach((log) => {
        if (log.content_id) {
          copyCountMap[log.content_id] = (copyCountMap[log.content_id] || 0) + 1;
        }
      });

      // Sort by copy count descending
      const sortedContents = contents.sort((a, b) => {
        const countA = copyCountMap[a.id] || 0;
        const countB = copyCountMap[b.id] || 0;
        return countB - countA;
      });

      return { data: sortedContents as ContentWithTopic[], error: null };
    }

    // For other sort options, use database ordering
    let query = supabase
      .from("contents")
      .select(`
        *,
        topics (id, name, slug)
      `)
      .eq("is_published", true);

    switch (sortBy) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "views":
        query = query.order("view_count", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data, error } = await query;
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

  getByShortId: async (shortId: string) => {
    // Query using the short_id column (generated column: last 8 chars of id)
    const { data, error } = await supabase
      .from("contents")
      .select(`
        *,
        topics (id, name, slug)
      `)
      .eq("short_id", shortId)
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

  incrementViewCount: async (id: string) => {
    // Get current view count then increment
    const { data: current } = await supabase
      .from("contents")
      .select("view_count")
      .eq("id", id)
      .maybeSingle();
    
    if (current) {
      await supabase
        .from("contents")
        .update({ view_count: (current.view_count || 0) + 1 })
        .eq("id", id);
    }
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
