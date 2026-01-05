import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { ThemeToggle } from "@/components/ThemeToggle";

const LoginRedirectPage = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(ROUTES.CONTENT_LIBRARY, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoToLibrary = () => {
    navigate(ROUTES.CONTENT_LIBRARY, { replace: true });
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            <span className="gradient-text">MKT</span> Viral Content
          </span>
        </Link>

        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-6"
        >
          <CheckCircle className="h-16 w-16 text-primary" />
        </motion.div>

        {/* Message */}
        <h1 className="text-2xl font-bold mb-4">
          Tài khoản đã được kích hoạt!
        </h1>
        <p className="text-muted-foreground mb-6">
          Hệ thống sẽ chuyển bạn đến Thư Viện trong giây lát.
        </p>

        {/* Countdown */}
        <div className="glass rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>
              Chuyển hướng sau{" "}
              <span className="font-bold text-primary text-xl">{countdown}</span>{" "}
              giây
            </span>
          </div>
        </div>

        {/* Button */}
        <Button
          onClick={handleGoToLibrary}
          size="lg"
          className="gap-2"
        >
          Vào Thư Viện ngay
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
};

export default LoginRedirectPage;
