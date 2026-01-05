import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md relative z-10"
      >
        {/* Icon */}
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10 mb-6">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>

        {/* Title */}
        <h1 className="text-6xl font-bold mb-4 gradient-text">404</h1>
        
        {/* Message */}
        <p className="text-lg text-muted-foreground mb-6">
          Liên kết bạn truy cập không hợp lệ hoặc đã bị xóa.
        </p>

        {/* Countdown */}
        <div className="glass rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>
              Tự động chuyển hướng sau{" "}
              <span className="font-bold text-primary text-lg">{countdown}</span>{" "}
              giây
            </span>
          </div>
        </div>

        {/* Button */}
        <Button 
          onClick={handleGoToLibrary} 
          className="gap-2"
          size="lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Thư Viện ngay
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
