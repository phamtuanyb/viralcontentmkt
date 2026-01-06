import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/constants";
import { Loader2 } from "lucide-react";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireActive?: boolean;
  requireAdmin?: boolean;
  requireEditor?: boolean;
  allowPending?: boolean;
}

export const RouteGuard = ({
  children,
  requireAuth = false,
  requireActive = false,
  requireAdmin = false,
  requireEditor = false,
  allowPending = false,
}: RouteGuardProps) => {
  const { user, profile, isLoading, isAdmin, isEditor, isActive, isPending } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in but auth required
  if (requireAuth && !user) {
    return <Navigate to={ROUTES.AUTH} state={{ from: location }} replace />;
  }

  // Logged in but pending - redirect to waiting room
  if (user && isPending() && !allowPending && location.pathname !== ROUTES.WAITING_ROOM) {
    return <Navigate to={ROUTES.WAITING_ROOM} replace />;
  }

  // Require active status
  if (requireActive && !isActive()) {
    return <Navigate to={ROUTES.WAITING_ROOM} replace />;
  }

  // Require admin role
  if (requireAdmin && !isAdmin()) {
    return <Navigate to={ROUTES.CONTENT_LIBRARY} replace />;
  }

  // Require editor role (editor or admin can access)
  if (requireEditor && !isEditor() && !isAdmin()) {
    return <Navigate to={ROUTES.CONTENT_LIBRARY} replace />;
  }

  return <>{children}</>;
};
