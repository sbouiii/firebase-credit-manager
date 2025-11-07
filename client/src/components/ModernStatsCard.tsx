import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ModernStatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: number;
  progress?: number;
  gradient?: string;
  delay?: number;
}

export function ModernStatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  progress,
  gradient = "from-blue-500 to-purple-500",
  delay = 0,
}: ModernStatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, type: "spring", bounce: 0.2 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative group"
    >
      {/* Glowing background effect */}
      <motion.div
        className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0, 0.1, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background to-muted/20">
        {/* Animated gradient border */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
          style={{
            background: `linear-gradient(45deg, transparent 30%, rgba(var(--primary-rgb), 0.3) 50%, transparent 70%)`,
            backgroundSize: "200% 200%",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
              <motion.h3
                className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.1 }}
              >
                {value}
              </motion.h3>
            </div>
            <motion.div
              className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: delay + 0.2, type: "spring", bounce: 0.5 }}
              whileHover={{ rotate: 360, scale: 1.1 }}
            >
              {/* Inner glow */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-white/20"
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
              <Icon className="h-7 w-7 text-white relative z-10" strokeWidth={2.5} />
            </motion.div>
          </div>

          {description && (
            <motion.p
              className="text-xs text-muted-foreground mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
            >
              {description}
            </motion.p>
          )}

          {progress !== undefined && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              transition={{ delay: delay + 0.4, duration: 0.6 }}
            >
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}

          {trend !== undefined && (
            <motion.div
              className="flex items-center gap-1 mt-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.4 }}
            >
              <span className={`text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </motion.div>
          )}

          {/* Decorative particles */}
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden rounded-xl">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/30"
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
        </CardContent>
      </Card>
    </motion.div>
  );
}

