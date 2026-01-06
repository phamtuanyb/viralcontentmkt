import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authApi } from "@/api/auth.api";
import { ROUTES } from "@/constants";
import { toast } from "@/hooks/use-toast";
import { Zap, Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";

const emailSchema = z.string().email("Email không hợp lệ");
const passwordSchema = z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự");

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, isActive, isPending, isLoading } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect when user state changes (after successful login)
  useEffect(() => {
    // Wait for loading to complete before checking user state
    if (isLoading) return;
    
    if (user) {
      if (isPending()) {
        navigate(ROUTES.WAITING_ROOM, { replace: true });
      } else if (isActive()) {
        navigate(ROUTES.LOGIN_REDIRECT, { replace: true });
      }
    }
  }, [user, isPending, isActive, navigate, isLoading]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    try {
      emailSchema.parse(formData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    try {
      passwordSchema.parse(formData.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    if (!isLogin && !formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await authApi.signIn(formData.email, formData.password, rememberMe);
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Lỗi",
              description: "Email hoặc mật khẩu không đúng",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Lỗi",
              description: error.message,
              variant: "destructive"
            });
          }
          setIsSubmitting(false);
        }
        // Don't setIsSubmitting(false) on success - let the redirect happen
        // The useEffect will handle navigation when user state updates
      } else {
        const { error } = await authApi.signUp(formData.email, formData.password, formData.fullName);
        
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Lỗi",
              description: "Email đã được đăng ký",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Lỗi",
              description: error.message,
              variant: "destructive"
            });
          }
          setIsSubmitting(false);
        } else {
          toast({
            title: "Đăng ký thành công!",
            description: "Tài khoản của bạn đang chờ được kích hoạt bởi quản trị viên."
          });
          // Don't setIsSubmitting(false) - navigation will unmount component
        }
        // useEffect will handle navigation for signup as well
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi. Vui lòng thử lại.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Back button */}
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="glass-strong rounded-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              <span className="gradient-text">MKT</span> Viral Content
            </span>
          </div>

          {/* Toggle */}
          <div className="flex gap-2 p-1 rounded-lg bg-secondary mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="bg-background/50"
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-background/50"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-background/50"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Ghi nhớ tài khoản (không tự đăng xuất)
                </label>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                "Đăng nhập"
              ) : (
                "Đăng ký"
              )}
            </Button>
          </form>

          {!isLogin && (
            <p className="mt-4 text-xs text-center text-muted-foreground">
              Sau khi đăng ký, tài khoản của bạn cần được quản trị viên kích
              hoạt trước khi sử dụng.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
