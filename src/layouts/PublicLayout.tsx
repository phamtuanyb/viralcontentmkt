import { Outlet, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES, APP_NAME } from "@/constants";
import { Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const PublicLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="gradient-text">MKT</span> Viral
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              onClick={() => navigate(ROUTES.AUTH)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2026 {APP_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
