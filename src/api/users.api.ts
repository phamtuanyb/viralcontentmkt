import { supabase } from "@/integrations/supabase/client";
import type { AppRole, UserProfile } from "@/store/authStore";

// List of roles that can be assigned through the UI
// Admin role is excluded - admins can only be created at database level
const ASSIGNABLE_ROLES: AppRole[] = ["editor", "sales"];

export const usersApi = {
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!userData) return null;

    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      avatar_url: userData.avatar_url,
      status: userData.status as UserProfile["status"],
      phone_number: profileData?.phone_number || null,
      signature_text: profileData?.signature_text || null,
    };
  },

  getRoles: async (userId: string): Promise<AppRole[]> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    return (data?.map((r) => r.role as AppRole)) || [];
  },

  getAllUsers: async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error };
  },

  updateUserStatus: async (userId: string, status: "pending" | "active" | "suspended") => {
    const { data, error } = await supabase
      .from("users")
      .update({ status })
      .eq("id", userId)
      .select()
      .single();

    return { data, error };
  },

  assignRole: async (userId: string, role: AppRole) => {
    // SECURITY: Block admin role assignment through API
    if (role === "admin") {
      console.error("SECURITY: Blocked attempt to assign admin role through API");
      return { 
        data: null, 
        error: { message: "Admin role cannot be assigned through the application. Contact database administrator." } 
      };
    }

    // Validate role is in the allowed list
    if (!ASSIGNABLE_ROLES.includes(role)) {
      console.error(`SECURITY: Blocked attempt to assign invalid role: ${role}`);
      return { 
        data: null, 
        error: { message: "Invalid role specified" } 
      };
    }

    const { data, error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role })
      .select()
      .single();

    return { data, error };
  },

  removeRole: async (userId: string, role: AppRole) => {
    // SECURITY: Block admin role removal through API
    if (role === "admin") {
      console.error("SECURITY: Blocked attempt to remove admin role through API");
      return { 
        error: { message: "Admin role cannot be modified through the application. Contact database administrator." } 
      };
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    return { error };
  },

  // Get list of roles that can be assigned through the UI
  getAssignableRoles: (): AppRole[] => {
    return [...ASSIGNABLE_ROLES];
  },
};
