import { supabase } from "@/integrations/supabase/client";

export type AdBannerPlacement = "library" | "content_detail";
export type AdBannerStatus = "active" | "hidden";

export interface AdBanner {
  id: string;
  title: string;
  image_url: string;
  target_url: string | null;
  placement_type: AdBannerPlacement;
  status: AdBannerStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AdBannerInput {
  title: string;
  image_url: string;
  target_url?: string;
  placement_type: AdBannerPlacement;
  status?: AdBannerStatus;
  sort_order?: number;
}

export const adBannersApi = {
  // Get active banners by placement
  getActiveByPlacement: async (placement: AdBannerPlacement) => {
    const { data, error } = await supabase
      .from("ad_banners")
      .select("*")
      .eq("placement_type", placement)
      .eq("status", "active")
      .order("sort_order", { ascending: true });

    return { data: data as AdBanner[] | null, error };
  },

  // Get all banners (for admin)
  getAll: async () => {
    const { data, error } = await supabase
      .from("ad_banners")
      .select("*")
      .order("placement_type", { ascending: true })
      .order("sort_order", { ascending: true });

    return { data: data as AdBanner[] | null, error };
  },

  // Create new banner
  create: async (banner: AdBannerInput) => {
    const { data, error } = await supabase
      .from("ad_banners")
      .insert({
        title: banner.title,
        image_url: banner.image_url,
        target_url: banner.target_url || null,
        placement_type: banner.placement_type,
        status: banner.status || "active",
        sort_order: banner.sort_order || 0,
      })
      .select()
      .single();

    return { data: data as AdBanner | null, error };
  },

  // Update banner
  update: async (id: string, banner: Partial<AdBannerInput>) => {
    const { data, error } = await supabase
      .from("ad_banners")
      .update({
        ...banner,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    return { data: data as AdBanner | null, error };
  },

  // Delete banner
  delete: async (id: string) => {
    const { error } = await supabase
      .from("ad_banners")
      .delete()
      .eq("id", id);

    return { error };
  },
};
