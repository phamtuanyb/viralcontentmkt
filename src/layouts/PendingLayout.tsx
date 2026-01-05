import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth.api";
import { Zap, Clock, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const PendingLayout = () => {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="gradient-text">MKT</span> Viral
            </span>
          </Link>
          
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-warning/10 mb-6 animate-pulse-glow">
            <Clock className="h-12 w-12 text-warning" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">
            Đang chờ kích hoạt
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Tài khoản của bạn ({profile?.email}) đang chờ được kích hoạt bởi quản trị viên. 
            Bạn sẽ được thông báo khi tài khoản được kích hoạt.
          </p>

          <div className="glass rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Nếu cần hỗ trợ, vui lòng liên hệ với quản trị viên hệ thống.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
