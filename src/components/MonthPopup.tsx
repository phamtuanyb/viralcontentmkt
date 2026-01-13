import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Calendar, PartyPopper, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { popupSettingsApi, type PopupSetting } from "@/api/popup-settings.api";

const MonthPopup = () => {
  const [activePopup, setActivePopup] = useState<PopupSetting | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { user, profile } = useAuthStore();

  useEffect(() => {
    const checkAndShowPopup = async () => {
      if (!user?.id) return;

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      // Get the last day of the current month
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const daysUntilEndOfMonth = Math.ceil(
        (lastDayOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Check if it's a new month (first day)
      const isNewMonth = now.getDate() === 1;

      // Fetch active popups
      const { data: popups } = await popupSettingsApi.getActive();
      if (!popups || popups.length === 0) return;

      // Fetch user's dismissals
      const { data: dismissals } = await popupSettingsApi.getUserDismissals(user.id);
      const dismissedIds = new Set(dismissals?.map(d => d.popup_id) || []);

      // Find the appropriate popup to show
      let popupToShow: PopupSetting | null = null;

      for (const popup of popups) {
        // Skip if already dismissed this month
        if (dismissedIds.has(popup.id)) continue;

        if (popup.popup_type === 'countdown' && daysUntilEndOfMonth <= popup.days_before_end) {
          popupToShow = popup;
          break;
        }

        if (popup.popup_type === 'new_month' && isNewMonth) {
          popupToShow = popup;
          break;
        }
      }

      if (popupToShow) {
        setActivePopup(popupToShow);
        // Small delay before showing popup
        setTimeout(() => setIsVisible(true), 500);
      }
    };

    checkAndShowPopup();
  }, [user?.id]);

  const handleDismiss = async () => {
    if (!user?.id || !activePopup) return;

    setIsVisible(false);
    
    // Dismiss in database
    await popupSettingsApi.dismissPopup(user.id, activePopup.id);
    
    setTimeout(() => setActivePopup(null), 300);
  };

  const getPersonalizedMessage = (message: string) => {
    const now = new Date();
    const userName = profile?.full_name || user?.email?.split('@')[0] || 'bạn';
    const currentMonth = now.getMonth() + 1;
    const year = now.getFullYear();
    const lastDayOfMonth = new Date(year, now.getMonth() + 1, 0);
    const daysLeft = Math.ceil(
      (lastDayOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return message
      .replace(/{name}/g, userName)
      .replace(/{month}/g, String(currentMonth))
      .replace(/{days}/g, String(daysLeft))
      .replace(/{year}/g, String(year));
  };

  if (!activePopup) return null;

  const isCountdown = activePopup.popup_type === 'countdown';

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className={`relative rounded-2xl border shadow-2xl overflow-hidden ${
              isCountdown 
                ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 border-orange-200 dark:border-orange-800'
                : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800'
            }`}>
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header decoration */}
              <div className={`h-2 ${
                isCountdown 
                  ? 'bg-gradient-to-r from-orange-400 to-red-500'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500'
              }`} />

              <div className="p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-full ${
                    isCountdown 
                      ? 'bg-orange-100 dark:bg-orange-900/30'
                      : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {isCountdown ? (
                      <Clock className={`h-8 w-8 ${
                        isCountdown ? 'text-orange-600' : 'text-green-600'
                      }`} />
                    ) : (
                      <PartyPopper className="h-8 w-8 text-green-600" />
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className={`text-xl font-bold text-center mb-3 ${
                  isCountdown ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'
                }`}>
                  {activePopup.title}
                </h2>

                {/* Message */}
                <p className="text-center text-muted-foreground leading-relaxed whitespace-pre-line">
                  {getPersonalizedMessage(activePopup.message)}
                </p>

                {/* Action button */}
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleDismiss}
                    className={`px-6 ${
                      isCountdown 
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                    }`}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Đã hiểu!
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MonthPopup;
