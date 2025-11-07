import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, Lock, X, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreditBlockedAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  remainingAmount: number;
}

export function CreditBlockedAlert({
  open,
  onOpenChange,
  customerName,
  remainingAmount,
}: CreditBlockedAlertProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative"
            >
              {/* Glowing background effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/20 via-orange-500/20 to-yellow-500/20 blur-3xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.7, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Main card */}
              <div className="relative bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/50 dark:via-orange-950/50 dark:to-yellow-950/50 rounded-2xl border-2 border-red-200 dark:border-red-800 shadow-2xl overflow-hidden">
                {/* Animated border glow */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "linear-gradient(45deg, transparent 30%, rgba(239, 68, 68, 0.3) 50%, transparent 70%)",
                    backgroundSize: "200% 200%",
                  }}
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Content */}
                <div className="relative p-6 space-y-4">
                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                    onClick={() => onOpenChange(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {/* Icon container with animation */}
                  <div className="flex justify-center">
                    <motion.div
                      className="relative"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        duration: 0.8,
                        bounce: 0.5,
                      }}
                    >
                      {/* Pulsing ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-red-400"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.8, 0, 0.8],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      {/* Icon circle */}
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                        <motion.div
                          animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Shield className="h-10 w-10 text-white" strokeWidth={2.5} />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Title with animation */}
                  <motion.h3
                    className="text-2xl font-bold text-center bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {t("customers.cannotDeleteCustomer")}
                  </motion.h3>

                  {/* Description */}
                  <motion.p
                    className="text-center text-muted-foreground text-sm leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {t("customers.cannotDeleteCustomerDesc")}
                  </motion.p>

                  {/* Customer info card */}
                  <motion.div
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-red-200 dark:border-red-800"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("credits.amount")}:{" "}
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {remainingAmount.toLocaleString()} {t("common.currency") || "TND"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Action buttons */}
                  <motion.div
                    className="flex gap-2 pt-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg"
                      onClick={() => onOpenChange(false)}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {t("common.understand") || "I understand"}
                    </Button>
                  </motion.div>

                  {/* Decorative elements */}
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-red-400/30"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          y: [0, -20, 0],
                          opacity: [0.3, 0.6, 0.3],
                          scale: [1, 1.5, 1],
                        }}
                        transition={{
                          duration: 2 + Math.random(),
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

