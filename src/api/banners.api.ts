import { supabase } from "@/integrations/supabase/client";

export interface HomepageBanner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface ProgramBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export const bannersApi = {
  getActiveHomepageBanners: async () => {
    const { data, error } = await supabase
      .from("homepage_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return { data: data as HomepageBanner[] | null, error };
  },

  getAllHomepageBanners: async () => {
    const { data, error } = await supabase
      .from("homepage_banners")
      .select("*")
      .order("sort_order", { ascending: true });

    return { data: data as HomepageBanner[] | null, error };
  },

  createHomepageBanner: async (banner: { title: string; image_url: string; link_url?: string; is_active?: boolean; sort_order?: number }) => {
    const { data, error } = await supabase
      .from("homepage_banners")
      .insert([banner])
      .select()
      .single();

    return { data, error };
  },

  updateHomepageBanner: async (id: string, banner: Partial<HomepageBanner>) => {
    const { data, error } = await supabase
      .from("homepage_banners")
      .update(banner)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  },

  deleteHomepageBanner: async (id: string) => {
    const { error } = await supabase
      .from("homepage_banners")
      .delete()
      .eq("id", id);

    return { error };
  },

  getActiveProgramBanners: async () => {
    const { data, error } = await supabase
      .from("program_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return { data: data as ProgramBanner[] | null, error };
  },

  getAllProgramBanners: async () => {
    const { data, error } = await supabase
      .from("program_banners")
      .select("*")
      .order("sort_order", { ascending: true });

    return { data: data as ProgramBanner[] | null, error };
  },

  createProgramBanner: async (banner: { title: string; image_url: string; subtitle?: string; link_url?: string; is_active?: boolean; sort_order?: number }) => {
    const { data, error } = await supabase
      .from("program_banners")
      .insert([banner])
      .select()
      .single();

    return { data, error };
  },

  updateProgramBanner: async (id: string, banner: Partial<ProgramBanner>) => {
    const { data, error } = await supabase
      .from("program_banners")
      .update(banner)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  },

  deleteProgramBanner: async (id: string) => {
    const { error } = await supabase
      .from("program_banners")
      .delete()
      .eq("id", id);

    return { error };
  },
};
