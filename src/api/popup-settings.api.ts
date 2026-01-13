import { supabase } from "@/integrations/supabase/client";

export interface PopupSetting {
  id: string;
  title: string;
  message: string;
  popup_type: 'countdown' | 'new_month';
  days_before_end: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface PopupDismissal {
  id: string;
  user_id: string;
  popup_id: string;
  dismissed_for_month: string;
  dismissed_at: string;
}

export const popupSettingsApi = {
  // Get all popup settings (for admin)
  async getAll() {
    const { data, error } = await supabase
      .from('month_popup_settings')
      .select('*')
      .order('popup_type');
    return { data: data as PopupSetting[] | null, error };
  },

  // Get active popup settings
  async getActive() {
    const { data, error } = await supabase
      .from('month_popup_settings')
      .select('*')
      .eq('is_active', true);
    return { data: data as PopupSetting[] | null, error };
  },

  // Create popup setting
  async create(setting: Omit<PopupSetting, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('month_popup_settings')
      .insert(setting)
      .select()
      .single();
    return { data: data as PopupSetting | null, error };
  },

  // Update popup setting
  async update(id: string, setting: Partial<PopupSetting>) {
    const { data, error } = await supabase
      .from('month_popup_settings')
      .update(setting)
      .eq('id', id)
      .select()
      .single();
    return { data: data as PopupSetting | null, error };
  },

  // Delete popup setting
  async delete(id: string) {
    const { error } = await supabase
      .from('month_popup_settings')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Get user's dismissed popups for current month
  async getUserDismissals(userId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data, error } = await supabase
      .from('user_popup_dismissals')
      .select('*')
      .eq('user_id', userId)
      .eq('dismissed_for_month', currentMonth);
    return { data: data as PopupDismissal[] | null, error };
  },

  // Dismiss a popup for current month
  async dismissPopup(userId: string, popupId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { error } = await supabase
      .from('user_popup_dismissals')
      .insert({
        user_id: userId,
        popup_id: popupId,
        dismissed_for_month: currentMonth
      });
    return { error };
  }
};
