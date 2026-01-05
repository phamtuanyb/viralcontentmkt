import { supabase } from "@/integrations/supabase/client";

export interface Rating {
  id: string;
  content_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface ContentRatingStats {
  average: number;
  count: number;
  userRating?: number;
}

export const ratingsApi = {
  getByContentId: async (contentId: string) => {
    const { data, error } = await supabase
      .from("content_ratings")
      .select("*")
      .eq("content_id", contentId);

    return { data: data as Rating[] | null, error };
  },

  getStats: async (contentId: string, userId?: string): Promise<ContentRatingStats> => {
    const { data: ratings } = await supabase
      .from("content_ratings")
      .select("rating, user_id")
      .eq("content_id", contentId);

    if (!ratings || ratings.length === 0) {
      return { average: 0, count: 0 };
    }

    const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const userRating = userId ? ratings.find(r => r.user_id === userId)?.rating : undefined;

    return {
      average: Math.round(average * 10) / 10,
      count: ratings.length,
      userRating,
    };
  },

  upsert: async (contentId: string, userId: string, rating: number) => {
    const { data, error } = await supabase
      .from("content_ratings")
      .upsert(
        { content_id: contentId, user_id: userId, rating },
        { onConflict: "content_id,user_id" }
      )
      .select()
      .single();

    return { data: data as Rating | null, error };
  },

  delete: async (contentId: string, userId: string) => {
    const { error } = await supabase
      .from("content_ratings")
      .delete()
      .eq("content_id", contentId)
      .eq("user_id", userId);

    return { error };
  },
};
