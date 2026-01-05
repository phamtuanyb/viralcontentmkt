import { supabase } from "@/integrations/supabase/client";

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "hidden";
  sort_order: number;
  created_at: string;
}

export const topicsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .order("sort_order", { ascending: true });

    return { data: data as Topic[] | null, error };
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("status", "active")
      .order("sort_order", { ascending: true });

    return { data: data as Topic[] | null, error };
  },

  create: async (topic: { name: string; slug: string; description?: string; status?: "active" | "hidden"; sort_order?: number }) => {
    const { data, error } = await supabase
      .from("topics")
      .insert([topic])
      .select()
      .single();

    return { data, error };
  },

  update: async (id: string, topic: Partial<Topic>) => {
    const { data, error } = await supabase
      .from("topics")
      .update(topic)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("topics")
      .delete()
      .eq("id", id);

    return { error };
  },
};
