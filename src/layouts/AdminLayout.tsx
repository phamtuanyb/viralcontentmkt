import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES, APP_NAME } from "@/constants";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth.api";
import { 
  Zap, 
  Users, 
  FileText, 
  Image, 
  Tags, 
  Megaphone,
  LogOut,
  ChevronRight,
  LayoutDashboard 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const adminMenuItems = [
  { path: ROUTES.ADMIN, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: ROUTES.ADMIN_USERS, label: "Người dùng", icon: Users },
  { path: ROUTES.ADMIN_TOPICS, label: "Chủ đề", icon: Tags },
  { path: ROUTES.ADMIN_CONTENTS, label: "Nội dung", icon: FileText },
  { path: ROUTES.ADMIN_BANNERS, label: "Banner trang chủ", icon: Image },
  { path: ROUTES.ADMIN_PROGRAM_BANNERS, label: "Banner chương trình", icon: Megaphone },
  { path: ROUTES.ADMIN_AD_BANNERS, label: "Banner quảng cáo", icon: Megaphone },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, reset } = useAuthStore();

  const handleLogout = async () => {
    const { error } = await authApi.signOut();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      reset();
      navigate(ROUTES.HOME);
    }
  };

  const isActiveRoute = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-40 flex flex-col">
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Link to={ROUTES.CONTENT_LIBRARY} className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-sidebar-primary/10 group-hover:bg-sidebar-primary/20 transition-colors">
              <Zap className="h-5 w-5 text-sidebar-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
              Admin
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminMenuItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActiveRoute(item.path, item.exact) && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                <ChevronRight className={cn(
                  "ml-auto h-4 w-4 transition-transform",
                  isActiveRoute(item.path, item.exact) && "rotate-90"
                )} />
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
