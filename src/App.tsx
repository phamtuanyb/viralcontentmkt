import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RouteGuard } from "@/auth";
import { PublicLayout, AppLayout, AdminLayout, EditorLayout } from "@/layouts";
import { ROUTES } from "@/constants";
import { ThemeProvider } from "@/components/ThemeProvider";

// Pages
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import LoginRedirectPage from "@/pages/LoginRedirectPage";
import WaitingRoomPage from "@/pages/WaitingRoomPage";
import ContentLibraryPage from "@/pages/ContentLibraryPage";
import ContentDetailPage from "@/pages/ContentDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminTopicsPage from "@/pages/admin/AdminTopicsPage";
import AdminContentsPage from "@/pages/admin/AdminContentsPage";
import AdminContentEditorPage from "@/pages/admin/AdminContentEditorPage";
import AdminBannersPage from "@/pages/admin/AdminBannersPage";
import AdminProgramBannersPage from "@/pages/admin/AdminProgramBannersPage";
import AdminAdBannersPage from "@/pages/admin/AdminAdBannersPage";
import EditorContentsPage from "@/pages/editor/EditorContentsPage";
import EditorContentEditorPage from "@/pages/editor/EditorContentEditorPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="mkt-viral-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path={ROUTES.HOME} element={<LandingPage />} />
              </Route>

              {/* Auth page */}
              <Route path={ROUTES.AUTH} element={<AuthPage />} />

              {/* Login redirect page for active users */}
              <Route
                path={ROUTES.LOGIN_REDIRECT}
                element={
                  <RouteGuard requireAuth requireActive>
                    <LoginRedirectPage />
                  </RouteGuard>
                }
              />

              {/* Waiting room for pending users */}
              <Route
                path={ROUTES.WAITING_ROOM}
                element={
                  <RouteGuard requireAuth allowPending>
                    <WaitingRoomPage />
                  </RouteGuard>
                }
              />

              {/* App routes (requires active user) */}
              <Route
                element={
                  <RouteGuard requireAuth requireActive>
                    <AppLayout />
                  </RouteGuard>
                }
              >
                <Route path={ROUTES.CONTENT_LIBRARY} element={<ContentLibraryPage />} />
                <Route path="/content/:slug" element={<ContentDetailPage />} />
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
              </Route>

              {/* Editor routes (requires editor role) */}
              <Route
                element={
                  <RouteGuard requireAuth requireActive requireEditor>
                    <EditorLayout />
                  </RouteGuard>
                }
              >
                <Route path={ROUTES.MY_CONTENTS} element={<EditorContentsPage />} />
                <Route path={ROUTES.MY_CONTENT_NEW} element={<EditorContentEditorPage />} />
                <Route path="/my-contents/:id/edit" element={<EditorContentEditorPage />} />
              </Route>

              {/* Admin routes */}
              <Route
                element={
                  <RouteGuard requireAuth requireActive requireAdmin>
                    <AdminLayout />
                  </RouteGuard>
                }
              >
                <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
                <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
                <Route path={ROUTES.ADMIN_TOPICS} element={<AdminTopicsPage />} />
                <Route path={ROUTES.ADMIN_CONTENTS} element={<AdminContentsPage />} />
                <Route path={ROUTES.ADMIN_CONTENT_NEW} element={<AdminContentEditorPage />} />
                <Route path="/admin/contents/:id/edit" element={<AdminContentEditorPage />} />
                <Route path={ROUTES.ADMIN_BANNERS} element={<AdminBannersPage />} />
                <Route path={ROUTES.ADMIN_PROGRAM_BANNERS} element={<AdminProgramBannersPage />} />
                <Route path={ROUTES.ADMIN_AD_BANNERS} element={<AdminAdBannersPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
