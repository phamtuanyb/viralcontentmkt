import { supabase } from "@/integrations/supabase/client";

export interface ActiveMember {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  activity_score: number;
}

export interface TopEditor {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  content_count: number;
  avg_rating: number;
  total_views: number;
}

export const leaderboardApi = {
  getTopActiveMembers: async (limit: number = 10) => {
    const { data, error } = await supabase.rpc("get_top_active_members", {
      limit_count: limit,
    });

    return { data: data as ActiveMember[] | null, error };
  },

  getTopEditors: async (limit: number = 10) => {
    const { data, error } = await supabase.rpc("get_top_editors", {
      limit_count: limit,
    });

    return { data: data as TopEditor[] | null, error };
  },
};
