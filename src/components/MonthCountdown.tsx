import { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";

const MonthCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      // Get the last day of the current month at 23:59:59
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      const difference = endOfMonth.getTime() - now.getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentMonth = new Date().toLocaleDateString("vi-VN", { month: "long" });

  return (
    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-orange-500/20">
          <Clock className="h-3.5 w-3.5 text-orange-500" />
        </div>
        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
          Đếm ngược cuối tháng
        </span>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">Chỉ còn</p>
        
        <div className="flex items-center justify-center gap-1 text-sm">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-orange-600 dark:text-orange-400 tabular-nums">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground">Ngày</span>
          </div>
          <span className="text-orange-500 font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-orange-600 dark:text-orange-400 tabular-nums">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground">Giờ</span>
          </div>
          <span className="text-orange-500 font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-orange-600 dark:text-orange-400 tabular-nums">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground">Phút</span>
          </div>
          <span className="text-orange-500 font-bold">:</span>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-orange-600 dark:text-orange-400 tabular-nums">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground">Giây</span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
          <Calendar className="h-3 w-3" />
          Nữa là hết tháng {new Date().getMonth() + 1}
        </p>
      </div>
    </div>
  );
};

export default MonthCountdown;
