import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, X, UserX, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface DeleteCustomerAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteCustomerAlert({
  open,
  onOpenChange,
  customerName,
  onConfirm,
  isDeleting = false,
}: DeleteCustomerAlertProps) {
  const { t } = useLanguage();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20, rotateX: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20, rotateX: 15 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
              className="relative"
            >
              {/* Animated background glow with multiple layers */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/30 via-orange-500/20 to-pink-500/30 blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.6, 0.4],
                  rotate: [0, 90, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-tl from-purple-500/20 via-red-500/20 to-orange-500/20 blur-2xl"
                animate={{
                  scale: [1.1, 1, 1.1],
                  opacity: [0.3, 0.5, 0.3],
                  rotate: [90, 0, 90],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Main card */}
              <div className="relative bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 dark:from-red-950/50 dark:via-orange-950/50 dark:to-pink-950/50 rounded-2xl border-2 border-red-300 dark:border-red-700 shadow-2xl overflow-hidden">
                {/* Animated border shimmer */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "linear-gradient(45deg, transparent 30%, rgba(239, 68, 68, 0.4) 50%, transparent 70%)",
                    backgroundSize: "200% 200%",
                  }}
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Content */}
                <div className="relative p-6 space-y-5">
                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 z-10"
                    onClick={() => onOpenChange(false)}
                    disabled={isDeleting}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {/* Icon container with spectacular animation */}
                  <div className="flex justify-center pt-2">
                    <motion.div
                      className="relative"
                      initial={{ scale: 0, rotate: -360, y: -50 }}
                      animate={{ scale: 1, rotate: 0, y: 0 }}
                      transition={{
                        type: "spring",
                        duration: 1,
                        bounce: 0.4,
                      }}
                    >
                      {/* Multiple pulsing rings */}
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 rounded-full border-4 border-red-400"
                          style={{
                            scale: 1 + i * 0.3,
                          }}
                          animate={{
                            scale: [1 + i * 0.3, 1.5 + i * 0.3, 1 + i * 0.3],
                            opacity: [0.8 - i * 0.2, 0, 0.8 - i * 0.2],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.3,
                          }}
                        />
                      ))}
                      
                      {/* Main icon circle with gradient */}
                      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 via-orange-500 to-pink-500 flex items-center justify-center shadow-2xl">
                        {/* Inner glow */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-white/20"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        <motion.div
                          animate={{
                            rotate: [0, 15, -15, 0],
                            scale: [1, 1.15, 1],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Trash2 className="h-12 w-12 text-white" strokeWidth={2.5} />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Title with gradient text */}
                  <motion.h3
                    className="text-2xl font-bold text-center bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {t("customers.deleteConfirm")} {customerName}?
                  </motion.h3>

                  {/* Warning message */}
                  <motion.div
                    className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 border-2 border-red-200 dark:border-red-800"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1">
                          {t("customers.deleteWarning") || "This action cannot be undone"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("customers.deleteWarningDesc") || "All associated credits will also be permanently deleted."}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Customer name badge */}
                  <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50 border border-red-200 dark:border-red-800">
                      <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                        {customerName}
                      </span>
                    </div>
                  </motion.div>

                  {/* Action buttons */}
                  <motion.div
                    className="flex gap-3 pt-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      variant="outline"
                      className="flex-1 border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => onOpenChange(false)}
                      disabled={isDeleting}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 hover:from-red-600 hover:via-orange-600 hover:to-pink-600 text-white shadow-lg relative overflow-hidden group"
                      onClick={handleConfirm}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <motion.div
                            className="absolute inset-0 bg-white/20"
                            animate={{
                              x: ["-100%", "100%"],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          <span className="relative">{t("common.deleting") || "Deleting..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 relative z-10" />
                          <span className="relative z-10">{t("common.delete")}</span>
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Floating particles */}
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-red-400/40"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          y: [0, -30, 0],
                          x: [0, Math.random() * 20 - 10, 0],
                          opacity: [0.4, 0.8, 0.4],
                          scale: [1, 1.8, 1],
                        }}
                        transition={{
                          duration: 2.5 + Math.random() * 1.5,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

