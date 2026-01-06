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
      gemini_api_key: profileData?.gemini_api_key || null,
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

    // Check if role already exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .maybeSingle();

    if (existingRole) {
      return { 
        data: existingRole, 
        error: null,
        alreadyExists: true 
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

  // Get all users with their roles
  getAllUsersWithRoles: async () => {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !users) return { data: null, error };

    // Fetch roles for all users
    const userIds = users.map(u => u.id);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    // Map roles to users
    const usersWithRoles = users.map(user => ({
      ...user,
      roles: roles?.filter(r => r.user_id === user.id).map(r => r.role as AppRole) || []
    }));

    return { data: usersWithRoles, error: null };
  },

  // Calculate user level from activity score (1-10)
  getUserLevel: (activityScore: number): { level: number; progress: number; nextLevelScore: number } => {
    // Level thresholds with increasing difficulty
    // Each level requires more points than the previous
    const levelThresholds = [
      0,      // Level 1: 0+
      50,     // Level 2: 50+
      150,    // Level 3: 150+
      350,    // Level 4: 350+
      700,    // Level 5: 700+
      1200,   // Level 6: 1200+
      2000,   // Level 7: 2000+
      3500,   // Level 8: 3500+
      6000,   // Level 9: 6000+
      10000,  // Level 10: 10000+
    ];

    let level = 1;
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (activityScore >= levelThresholds[i]) {
        level = i + 1;
        break;
      }
    }

    const currentLevelMin = levelThresholds[level - 1] || 0;
    const nextLevelMin = levelThresholds[level] || levelThresholds[levelThresholds.length - 1];
    const progress = level >= 10 ? 100 : Math.min(100, ((activityScore - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100);

    return { level, progress, nextLevelScore: nextLevelMin };
  },
};
